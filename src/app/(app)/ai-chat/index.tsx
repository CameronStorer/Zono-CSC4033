import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import { MarkdownResponse } from '@/components/markdown-response';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '@/contexts/theme-context';
import { SlideScreen } from '@/components/slide-screen';
import { supabase } from '@/components/supabase';
import { useAuth } from '@/components/auth-context';
import { OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_AUTH_TOKEN } from '@/constants/ai';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_W = (SCREEN_W - 48 - 10) / 2;

type Prompt = { id: string; label: string; icon: string; question: string };
type FriendInfo = {
  full_name: string; username: string; status: string | null;
  last_online: string | null; bio: string | null;
  last_lat: number | null; last_lng: number | null;
};

const PROMPTS: Prompt[] = [
  {
    id: 'hot',
    label: 'Hot places\namong friends',
    icon: '🔥',
    question: 'Based on my friends\' recent locations, which areas seem most popular right now? Give a brief, fun summary.',
  },
  {
    id: 'go',
    label: 'Where should\nI go?',
    icon: '🗺️',
    question: 'Looking at where my friends currently are, where would be a good spot for me to go to hang out?',
  },
  {
    id: 'online',
    label: "Who's online\nright now?",
    icon: '🟢',
    question: 'Which of my friends are currently online or were active in the last hour? List them and when they were last seen.',
  },
  {
    id: 'activities',
    label: 'Friend activities\n& hobbies',
    icon: '🎯',
    question: 'Based on my friends\' bios and profiles, what activities do they seem to enjoy most? Give a fun breakdown.',
  },
  {
    id: 'summary',
    label: 'Summarize my\nfriend group',
    icon: '👥',
    question: 'Give me a short, fun summary of my friend group\'s vibe based on their profiles.',
  },
  {
    id: 'closest',
    label: "Who's closest\nto me?",
    icon: '📍',
    question: 'Based on the coordinates, which of my friends is geographically closest to my current location?',
  },
];

function buildContext(
  me: { lat: number | null; lng: number | null },
  friends: FriendInfo[],
  poiMap: Record<string, string> = {},
): string {
  const now = new Date();
  const lines: string[] = [
    `Current user location: ${me.lat != null ? `${me.lat.toFixed(4)}, ${me.lng!.toFixed(4)}` : 'unknown'}`,
    `Current time: ${now.toLocaleString()}`,
    '',
    `Friends (${friends.length} total):`,
  ];
  for (const f of friends) {
    const mins = f.last_online
      ? Math.round((now.getTime() - new Date(f.last_online).getTime()) / 60000)
      : null;
    const lastSeen = mins != null ? `last seen ${mins} min ago` : 'last seen unknown';
    const loc = f.last_lat != null ? `at ${f.last_lat.toFixed(4)}, ${f.last_lng!.toFixed(4)}` : 'location unknown';
    const bio = f.bio ? `bio: "${f.bio}"` : 'no bio';
    const nearby = poiMap[f.username] ? `, currently near: ${poiMap[f.username]}` : '';
    lines.push(`- ${f.full_name} (@${f.username}): status=${f.status ?? 'unknown'}, ${lastSeen}, ${loc}, ${bio}${nearby}`);
  }
  return lines.join('\n');
}

// Queries OpenStreetMap Overpass API for named amenities/shops within the
// bounding box of all friend locations, then matches each friend to the
// closest POI within 150 m.
async function fetchNearbyPOI(friends: FriendInfo[]): Promise<Record<string, string>> {
  const located = friends.filter(f => f.last_lat != null && f.last_lng != null);
  if (!located.length) return {};

  const lats = located.map(f => f.last_lat!);
  const lngs = located.map(f => f.last_lng!);
  const pad = 0.004; // ~450 m padding so edge friends get coverage
  const s = (Math.min(...lats) - pad).toFixed(6);
  const n = (Math.max(...lats) + pad).toFixed(6);
  const w = (Math.min(...lngs) - pad).toFixed(6);
  const e = (Math.max(...lngs) + pad).toFixed(6);

  const query =
    `[out:json][timeout:20];` +
    `(node["name"]["amenity"](${s},${w},${n},${e});` +
    `node["name"]["shop"](${s},${w},${n},${e});` +
    `node["name"]["leisure"](${s},${w},${n},${e}););` +
    `out body;`;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) return {};

  const json = await res.json();
  type OsmNode = { lat: number; lon: number; tags: Record<string, string> };
  const pois: OsmNode[] = (json.elements ?? []).filter((el: any) => el.tags?.name);

  const result: Record<string, string> = {};
  for (const f of located) {
    let bestName = '';
    let bestDist = 150; // metres — only tag if within this radius
    for (const poi of pois) {
      const dLat = (f.last_lat! - poi.lat) * 111_320;
      const dLng = (f.last_lng! - poi.lon) * 111_320 * Math.cos(f.last_lat! * Math.PI / 180);
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);
      if (dist < bestDist) { bestDist = dist; bestName = poi.tags.name; }
    }
    if (bestName) result[f.username] = bestName;
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
            'When describing where someone is, use the nearest business, town, or landmark — NEVER output raw GPS coordinates, latitude and longitude, or decimal numbers. ' +
            'If the context shows a friend is "currently near" a specific place (like a restaurant, store, or venue), mention that place by name naturally in your response. ' +
            'Keep every response very short: 2–4 sentences or a tight bullet list (3–5 items max). ' +
            'Use emojis throughout to keep the tone fun and visual. ' +
            'Bold every friend name with **Name** markdown syntax so they stand out in the UI. ' +
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
          .select('full_name, username, status, last_online, bio, last_lat, last_lng')
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
