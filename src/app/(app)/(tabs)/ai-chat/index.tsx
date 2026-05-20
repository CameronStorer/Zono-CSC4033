import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import { MarkdownResponse } from '@/components/markdown-response';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/contexts/theme-context';
import { SlideScreen } from '@/components/slide-screen';
import { supabase } from '@/components/supabase';
import { useAuth } from '@/components/auth-context';
import { OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_AUTH_TOKEN } from '@/constants/ai';
import { router } from 'expo-router';
import { getDistanceMeters, formatDistance, compassBearing } from '@/utils/distance';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - 48 - 10) / 2;

type Prompt = { id: string; label: string; icon: string; question: string };
type FriendInfo = {
  id: number; full_name: string; username: string; status: string | null;
  last_seen: string | null; is_online: boolean | null; bio: string | null;
  last_lat: number | null; last_lng: number | null;
};

const PROMPTS: Prompt[] = [
  {
    id: 'whatsup',
    label: "What are my\nfriends up to?",
    icon: '👀',
    question: "Based on where each friend is, what they're near (restaurants, parks, etc.), their bios, and statuses — give me a fun rundown of what everyone seems to be up to right now.",
  },
  {
    id: 'closest',
    label: "Who's nearest\nto me?",
    icon: '🏃',
    question: "The context lists friends sorted nearest-first with rank numbers and exact distances in metres. Use those values to rank all my friends from nearest to farthest — show each person's formatted distance and direction.",
  },
  {
    id: 'hangout',
    label: 'Who should\nI hang with?',
    icon: '🤝',
    question: "Looking at who's online, how close they are, what places they're near, and their bios — which one friend is the best pick to hang out with right now and why?",
  },
  {
    id: 'meetup',
    label: 'Plan a\nmeetup spot',
    icon: '📍',
    question: "Based on where my friends are and what's nearby (restaurants, cafes, parks), suggest the best central meetup spot that works for the group. Factor in who's currently online.",
  },
  {
    id: 'group',
    label: 'Describe my\nfriend group',
    icon: '👥',
    question: "Give me a fun, creative description of my friend group — their collective vibe, what they seem to be into based on bios and statuses, what kind of crew they are, and any fun observations.",
  },
  {
    id: 'quiet',
    label: "Who's gone\nquiet?",
    icon: '👻',
    question: "Which friends have been offline the longest? Give me a playful check-in list using their actual last-active times so I know who to reach out to.",
  },
];

function friendActivityLabel(isOnline: boolean | null, lastSeen: string | null): string {
  const now = Date.now();
  const secs = lastSeen
    ? Math.round((now - new Date(lastSeen).getTime()) / 1000)
    : null;

  if (isOnline === true && secs != null && secs < 90) return 'online now';
  if (secs == null) return 'last seen: unknown';
  const mins = Math.round(secs / 60);
  if (mins < 2) return 'last active just now';
  if (mins < 60) return `last active ${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `last active ${hours}h ago`;
  const days = Math.round(hours / 24);
  return `last active ${days} day${days === 1 ? '' : 's'} ago`;
}

function buildContext(
  me: { lat: number | null; lng: number | null },
  friends: FriendInfo[],
  poiMap: Record<string, string> = {},
): string {
  const now = new Date();

  // Pre-compute distances so we can sort and give the AI exact metre values
  type WithDist = FriendInfo & { distMeters: number | null };
  const withDist: WithDist[] = friends.map(f => ({
    ...f,
    distMeters:
      f.last_lat != null && f.last_lng != null && me.lat != null && me.lng != null
        ? getDistanceMeters(
            { latitude: me.lat, longitude: me.lng },
            { latitude: f.last_lat, longitude: f.last_lng },
          )
        : null,
  }));

  // Sort nearest-first; friends with no location go to the end
  withDist.sort((a, b) => {
    if (a.distMeters == null && b.distMeters == null) return 0;
    if (a.distMeters == null) return 1;
    if (b.distMeters == null) return -1;
    return a.distMeters - b.distMeters;
  });

  const lines: string[] = [
    `Current time: ${now.toLocaleString()}`,
    '',
    `Friends (${friends.length} total, listed nearest-first):`,
  ];

  for (let i = 0; i < withDist.length; i++) {
    const f = withDist[i];
    const activity = friendActivityLabel(f.is_online, f.last_seen);

    let locationStr: string;
    if (f.distMeters != null && me.lat != null && me.lng != null) {
      const dir = compassBearing(me.lat, me.lng, f.last_lat!, f.last_lng!);
      // Include both human-readable distance AND raw metres so ranking is unambiguous
      locationStr = `${formatDistance(f.distMeters)} ${dir} from you (${Math.round(f.distMeters)} m)`;
    } else {
      locationStr = 'location unknown';
    }

    const parts: string[] = [`distance rank #${i + 1}`, activity, locationStr];
    if (f.bio) parts.push(`bio: "${f.bio}"`);
    if (f.status) parts.push(`status: "${f.status}"`);
    if (poiMap[f.username]) parts.push(`currently near: ${poiMap[f.username]}`);
    lines.push(`- ${f.full_name}: ${parts.join(', ')}`);
  }
  return lines.join('\n');
}

// Queries OpenStreetMap Overpass API for named places (restaurants, cafes,
// bars, shops, parks, etc.) near all friend locations and matches each friend
// to the closest place within 300 m. Returns a map of username → rich label
// like "Chipotle (fast_food, mexican)" so the AI has food/venue context.
async function fetchNearbyPOI(friends: FriendInfo[]): Promise<Record<string, string>> {
  const located = friends.filter(f => f.last_lat != null && f.last_lng != null);
  if (!located.length) return {};

  const lats = located.map(f => f.last_lat!);
  const lngs = located.map(f => f.last_lng!);
  const pad = 0.005; // ~550 m padding so edge friends get full coverage
  const s = (Math.min(...lats) - pad).toFixed(6);
  const n = (Math.max(...lats) + pad).toFixed(6);
  const w = (Math.min(...lngs) - pad).toFixed(6);
  const e = (Math.max(...lngs) + pad).toFixed(6);

  // Fetch nodes (small POIs) and ways (large venues like malls/restaurants)
  // "out center" on ways gives us a centroid coordinate
  const query =
    `[out:json][timeout:25];` +
    `(node["name"]["amenity"](${s},${w},${n},${e});` +
    `node["name"]["shop"](${s},${w},${n},${e});` +
    `node["name"]["leisure"](${s},${w},${n},${e});` +
    `node["name"]["tourism"](${s},${w},${n},${e});` +
    `way["name"]["amenity"](${s},${w},${n},${e}););` +
    `out center;`;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) return {};

  const json = await res.json();
  type OsmElement = {
    lat?: number; lon?: number;
    center?: { lat: number; lon: number };
    tags: Record<string, string>;
  };
  const pois: OsmElement[] = (json.elements ?? []).filter((el: any) => el.tags?.name);

  const result: Record<string, string> = {};
  for (const f of located) {
    let bestName = '';
    let bestTags: Record<string, string> = {};
    let bestDist = 300; // metres — expanded radius for restaurant coverage
    for (const poi of pois) {
      const poiLat = poi.lat ?? poi.center?.lat;
      const poiLon = poi.lon ?? poi.center?.lon;
      if (poiLat == null || poiLon == null) continue;
      const dist = getDistanceMeters(
        { latitude: f.last_lat!, longitude: f.last_lng! },
        { latitude: poiLat, longitude: poiLon },
      );
      if (dist < bestDist) { bestDist = dist; bestName = poi.tags.name; bestTags = poi.tags; }
    }
    if (bestName) {
      const type = bestTags.amenity || bestTags.shop || bestTags.leisure || bestTags.tourism || '';
      // cuisine tag can contain multiple values separated by ";"
      const cuisine = bestTags.cuisine
        ? bestTags.cuisine.split(';').map(s => s.trim()).slice(0, 2).join('/')
        : '';
      const detail = [type, cuisine].filter(Boolean).join(', ');
      result[f.username] = detail ? `${bestName} (${detail})` : bestName;
    }
  }
  return result;
}

// Returns a cancel function. Calls onChunk with each text piece as it streams,
// onDone when complete, onError with a human-readable message on failure.
function streamOllama(
  systemContext: string,
  question: string,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (msg: string) => void,
): () => void {
  const url = `${OLLAMA_BASE_URL.replace(/\/$/, '')}/api/chat`;
  const xhr = new XMLHttpRequest();
  xhr.open('POST', url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Authorization', `Bearer ${OLLAMA_AUTH_TOKEN}`);
  xhr.timeout = 120_000; // 2 minutes

  let processed = 0;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    onDone();
  };

  xhr.onprogress = () => {
    const newData = xhr.responseText.slice(processed);
    processed = xhr.responseText.length;
    for (const line of newData.split('\n')) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        if (obj.message?.content) onChunk(obj.message.content);
        if (obj.done) finish();
      } catch { /* incomplete chunk, wait for more */ }
    }
  };

  xhr.onload = () => {
    if (xhr.status !== 200) {
      onError(`Server error ${xhr.status} — ${xhr.responseText.slice(0, 120)}`);
    }
    finish();
  };

  xhr.onerror = () =>
    onError('Could not reach the AI server. Check your internet connection.');

  xhr.ontimeout = () =>
    onError('Request timed out (2 min). The model may still be loading — try again.');

  xhr.send(
    JSON.stringify({
      model: OLLAMA_MODEL,
      stream: true,
      messages: [
        {
          role: 'system',
          content:
            'You are Zono AI, a fun social assistant inside the Zono friend-tracking app. ' +
            'Answer using ONLY the context provided — never invent or guess anything not explicitly there; if unknown, say so. ' +
            'CRITICAL: Never mention latitude, longitude, coordinates, decimal degree values, or usernames (like @handle) — ever. Describe locations using distance and direction (e.g. "0.3 mi north of you") or a nearby place name only. ' +
            'If the context shows a friend is "currently near" a specific place (like a restaurant, store, or venue), mention that place by name naturally in your response. ' +
            'Use the "last active" time in the context to accurately describe how recently someone was online. Distinguish clearly between "online now", recent activity (minutes), and long inactivity (hours or days). ' +
            'Keep every response very short: 2–4 sentences or a tight bullet list (3–5 items max). ' +
            'Use emojis throughout to keep the tone fun and visual. ' +
            'CRITICAL: Bold **every single mention** of a friend\'s name using **Name** markdown, every time their name appears — even if mentioned multiple times. Never write a friend\'s name without the ** bold markers. ' +
            'Use markdown formatting (bullet lists with "- ", bold with **text**) for readability.\n\n' +
            systemContext,
        },
        { role: 'user', content: question },
      ],
    })
  );

  return () => { finished = true; xhr.abort(); };
}

type ServerStatus = { state: 'checking' } | { state: 'ok' } | { state: 'error'; detail: string };

export default function AiChat() {
  const { colors: C } = useAppTheme();
  const { profile } = useAuth();

  const [serverStatus, setServerStatus] = useState<ServerStatus>({ state: 'checking' });
  const [friends, setFriends] = useState<FriendInfo[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [poiMap, setPoiMap] = useState<Record<string, string>>({});
  const [poiReady, setPoiReady] = useState(false);

  const nameToIdMap = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const f of friends) {
      if (f.full_name) map[f.full_name] = f.id;
      map[f.username] = f.id;
    }
    return map;
  }, [friends]);

  const [activePrompt, setActivePrompt] = useState<Prompt | null>(null);
  const [responseText, setResponseText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef<(() => void) | null>(null);

  // Check server health with specific diagnostics
  useEffect(() => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `${OLLAMA_BASE_URL.replace(/\/$/, '')}/api/tags`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${OLLAMA_AUTH_TOKEN}`);
    xhr.timeout = 10_000;
    xhr.onload = () => {
      if (xhr.status === 200) {
        setServerStatus({ state: 'ok' });
      } else if (xhr.status === 401) {
        setServerStatus({ state: 'error', detail: '401 Unauthorized — API token mismatch' });
      } else {
        setServerStatus({ state: 'error', detail: `HTTP ${xhr.status} from server` });
      }
    };
    xhr.onerror = () =>
      setServerStatus({ state: 'error', detail: 'Network error — DNS failed or server unreachable (try cellular)' });
    xhr.ontimeout = () =>
      setServerStatus({ state: 'error', detail: 'Timed out (10 s) — server may be starting up' });
    xhr.send();
    return () => xhr.abort();
  }, []);

  // Load friends for context
  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      try {
        const { data: rows } = await supabase
          .from('friendships').select('friend_id').eq('user_id', profile.id);
        const ids = (rows ?? []).map((r: any) => r.friend_id);
        if (!ids.length) { setFriends([]); return; }
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name, username, status, last_seen, is_online, bio, last_lat, last_lng')
          .in('id', ids);
        const loaded = users ?? [];
        setFriends(loaded);
        // Fetch nearby POIs in the background; non-fatal if it fails
        fetchNearbyPOI(loaded)
          .then(map => { setPoiMap(map); setPoiReady(true); })
          .catch(() => setPoiReady(true));
      } catch { /* non-fatal */ }
      finally { setLoadingFriends(false); }
    })();
  }, [profile?.id]);

  const handlePrompt = (prompt: Prompt) => {
    cancelRef.current?.();
    setActivePrompt(prompt);
    setResponseText('');
    setError(null);
    setStreaming(true);

    const context = buildContext(
      { lat: profile?.last_lat ?? null, lng: profile?.last_lng ?? null },
      friends,
      poiMap,
    );

    cancelRef.current = streamOllama(
      context,
      prompt.question,
      (chunk) => setResponseText(prev => prev + chunk),
      () => setStreaming(false),
      (msg) => { setError(msg); setStreaming(false); },
    );
  };

  const handleBack = () => {
    cancelRef.current?.();
    setActivePrompt(null);
    setResponseText('');
    setError(null);
    setStreaming(false);
  };

  const serverDot =
    serverStatus.state === 'checking' ? '⚪' :
    serverStatus.state === 'ok'       ? '🟢' : '🔴';

  // ── Response view ─────────────────────────────────────────────────────────
  if (activePrompt) {
    return (
      <SlideScreen index={2}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
          <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
            <Pressable onPress={handleBack} hitSlop={8} style={{ marginBottom: 20 }}>
              <Text style={{ color: C.accent, fontSize: 16 }}>‹ Ask another</Text>
            </Pressable>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 28, marginRight: 10 }}>{activePrompt.icon}</Text>
              <Text style={{ color: C.text, fontSize: 20, fontWeight: '700', flex: 1 }}>
                {activePrompt.label.replace('\n', ' ')}
              </Text>
            </View>

            <View style={{
              backgroundColor: C.bgElement, borderRadius: 16,
              borderWidth: 1, borderColor: C.border,
              padding: 20, minHeight: 120, justifyContent: 'center',
            }}>
              {streaming && !responseText ? (
                <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                  <ActivityIndicator color={C.accent} size="large" />
                  <Text style={{ color: C.textMuted, fontSize: 14, marginTop: 12 }}>
                    Thinking…
                  </Text>
                </View>
              ) : error ? (
                <Text style={{ color: C.destructive, fontSize: 15, lineHeight: 22 }}>
                  ⚠️ {error}
                </Text>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ color: C.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
                      ZONO AI · {OLLAMA_MODEL}
                    </Text>
                    {streaming && (
                      <ActivityIndicator
                        color={C.accent} size="small"
                        style={{ marginLeft: 8 }}
                      />
                    )}
                  </View>
                  <MarkdownResponse
                    text={responseText}
                    streaming={streaming}
                    textColor={C.text}
                    accentColor={C.accent}
                    fontSize={16}
                    nameToIdMap={nameToIdMap}
                    onNamePress={(userId) =>
                      router.push({ pathname: '/profile/[id]', params: { id: String(userId) } })
                    }
                  />
                </>
              )}
            </View>

            {!streaming && (
              <Pressable
                onPress={() => handlePrompt(activePrompt)}
                style={({ pressed }) => ({
                  marginTop: 16, alignSelf: 'center',
                  paddingVertical: 10, paddingHorizontal: 22,
                  borderRadius: 20, borderWidth: 1, borderColor: C.border,
                  backgroundColor: C.bgElement, opacity: pressed ? 0.6 : 1,
                })}
              >
                <Text style={{ color: C.textSecondary, fontSize: 14 }}>↺ Try again</Text>
              </Pressable>
            )}
          </ScrollView>
        </SafeAreaView>
      </SlideScreen>
    );
  }

  // ── Prompt grid ───────────────────────────────────────────────────────────
  return (
    <SlideScreen index={2}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 120 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: C.text, marginBottom: 4 }}>
            Zono AI
          </Text>
          <Text style={{ color: C.textSecondary, fontSize: 14, marginBottom: 4 }}>
            {loadingFriends
              ? 'Loading friends…'
              : `Insights across ${friends.length} friend${friends.length !== 1 ? 's' : ''}`}
          </Text>
          <Text style={{ color: C.textMuted, fontSize: 12, marginBottom: 28 }}>
            {serverDot}{' '}
            {serverStatus.state === 'checking' ? 'Connecting to AI server…' :
             serverStatus.state === 'ok'
               ? `${OLLAMA_MODEL} ready  ${!loadingFriends ? (poiReady ? '· 📍 places loaded' : '· fetching nearby places…') : ''}`
               : serverStatus.detail}
          </Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {PROMPTS.map(prompt => (
              <Pressable
                key={prompt.id}
                onPress={() => handlePrompt(prompt)}
                disabled={loadingFriends || serverStatus.state === 'error'}
                style={({ pressed }) => ({
                  width: CARD_W,
                  backgroundColor: C.bgElement,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: C.border,
                  padding: 16,
                  opacity: pressed || loadingFriends || serverStatus.state === 'error' ? 0.5 : 1,
                })}
              >
                <Text style={{ fontSize: 26, marginBottom: 10 }}>{prompt.icon}</Text>
                <Text style={{ color: C.text, fontSize: 14, fontWeight: '600', lineHeight: 20 }}>
                  {prompt.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </SlideScreen>
  );
}
