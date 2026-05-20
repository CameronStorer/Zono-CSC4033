import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, Pressable, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { supabase } from '@/components/supabase';
import { useAuth } from '@/components/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { SlideScreen } from '@/components/slide-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import STICKERS from '@/data/stickers';

type Friend = {
  id: number;
  username: string;
  full_name: string;
  avatar_url: string | null;
};

type Message = {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
};

type RecentChat = {
  friend: Friend;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageIsMine: boolean;
};

function formatTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function Avatar({ name, uri, size }: { name: string; uri: string | null; size: number }) {
  const initials = name?.split(' ').filter(p => p.length > 0).map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '?';
  if (uri) {
    return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

export default function Messages() {
  const { colors: C } = useAppTheme();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const { friendId: friendIdParam } = useLocalSearchParams<{ friendId?: string }>();
  const handledFriendIdRef = useRef<string | null>(null);

  const [allFriends, setAllFriends] = useState<Friend[]>([]);
  const [recentChats, setRecentChats] = useState<RecentChat[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const searchResults = useMemo(() => {
    if (!searchText.trim()) return [];
    const q = searchText.toLowerCase();
    return allFriends.filter(
      f => f.full_name?.toLowerCase().includes(q) || f.username.toLowerCase().includes(q)
    );
  }, [searchText, allFriends]);

  const loadChats = useCallback(async () => {
    if (!profile?.id) return;
    setLoadingChats(true);
    try {
      const { data: rows } = await supabase
        .from('friendships').select('friend_id').eq('user_id', profile.id);
      const ids = (rows ?? []).map(r => r.friend_id as number);

      let friendList: Friend[] = [];
      if (ids.length > 0) {
        const { data: users } = await supabase
          .from('users').select('id, username, full_name, avatar_url').in('id', ids);
        friendList = (users ?? []) as Friend[];
      }
      setAllFriends(friendList);

      if (!ids.length) { setRecentChats([]); return; }

      const { data: msgs } = await supabase
        .from('direct_messages')
        .select('id, sender_id, receiver_id, content, created_at')
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      const seen = new Set<number>();
      const chats: RecentChat[] = [];
      for (const msg of (msgs ?? [])) {
        const partnerId: number = msg.sender_id === profile.id ? msg.receiver_id : msg.sender_id;
        if (seen.has(partnerId)) continue;
        seen.add(partnerId);
        const friend = friendList.find(f => f.id === partnerId);
        if (!friend) continue;
        chats.push({
          friend,
          lastMessage: msg.content,
          lastMessageTime: msg.created_at,
          lastMessageIsMine: msg.sender_id === profile.id,
        });
      }
      setRecentChats(chats);
    } catch (e) {
      console.log('messages: loadChats error', e);
    } finally {
      setLoadingChats(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Auto-open a specific friend's chat when navigated from profile page
  useEffect(() => {
    if (!friendIdParam || loadingChats || handledFriendIdRef.current === friendIdParam) return;
    handledFriendIdRef.current = friendIdParam;
    const fid = Number(friendIdParam);
    const found = allFriends.find(f => f.id === fid);
    if (found) {
      setSelectedFriend(found);
    } else {
      supabase.from('users').select('id, username, full_name, avatar_url')
        .eq('id', fid).single()
        .then(({ data }) => { if (data) setSelectedFriend(data as Friend); });
    }
  }, [friendIdParam, loadingChats, allFriends]);

  const loadMessages = useCallback(async (friend: Friend) => {
    if (!profile?.id) return;
    setLoadingMessages(true);
    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(
          `and(sender_id.eq.${profile.id},receiver_id.eq.${friend.id}),` +
          `and(sender_id.eq.${friend.id},receiver_id.eq.${profile.id})`
        )
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages(data ?? []);
    } catch (e) {
      console.log('messages: loadMessages error', e);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!selectedFriend || !profile?.id) return;
    loadMessages(selectedFriend);

    const channel = supabase
      .channel(`dm-${Math.min(profile.id, selectedFriend.id)}-${Math.max(profile.id, selectedFriend.id)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'direct_messages' },
        payload => {
          const msg = payload.new as Message;
          const isRelevant =
            (msg.sender_id === profile.id && msg.receiver_id === selectedFriend.id) ||
            (msg.sender_id === selectedFriend.id && msg.receiver_id === profile.id);
          if (isRelevant) setMessages(prev => [...prev, msg]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedFriend?.id, loadMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length]);

  const sendMessage = async () => {
    if (!messageText.trim() || !profile?.id || !selectedFriend || sending) return;
    const content = messageText.trim();
    setMessageText('');
    setSending(true);
    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({ sender_id: profile.id, receiver_id: selectedFriend.id, content });
      if (error) throw error;
      loadChats();
    } catch (e) {
      console.log('messages: sendMessage error', e);
    } finally {
      setSending(false);
    }
  };

  const sendSticker = async (stickerId: string) => {
    if (!profile?.id || !selectedFriend) return;
    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({ sender_id: profile.id, receiver_id: selectedFriend.id, content: `sticker:${stickerId}` });
      if (error) throw error;
      loadChats();
    } catch (e) {
      console.log('messages: sendSticker error', e);
    }
  };

  // ── Conversation view ────────────────────────────────────────────────────
  if (selectedFriend) {
    return (
      <SlideScreen index={1}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
          >
            {/* Header */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 16, paddingVertical: 12,
              backgroundColor: C.bgElement,
              borderBottomWidth: 1, borderBottomColor: C.border,
            }}>
              <Pressable
                onPress={() => { setSelectedFriend(null); setMessages([]); }}
                style={{ marginRight: 12, padding: 4 }}
                hitSlop={8}
              >
                <Text style={{ color: C.accent, fontSize: 17 }}>‹ Back</Text>
              </Pressable>
              <Avatar name={selectedFriend.full_name} uri={selectedFriend.avatar_url} size={36} />
              <View style={{ marginLeft: 10 }}>
                <Text style={{ color: C.text, fontWeight: '600', fontSize: 16 }}>
                  {selectedFriend.full_name}
                </Text>
                <Text style={{ color: C.textSecondary, fontSize: 13 }}>
                  @{selectedFriend.username}
                </Text>
              </View>
            </View>

            {/* Messages list */}
            {loadingMessages ? (
              <ActivityIndicator style={{ flex: 1 }} color={C.accent} />
            ) : (
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={m => String(m.id)}
                contentContainerStyle={{ padding: 16, paddingBottom: 8, flexGrow: 1 }}
                ListEmptyComponent={
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 }}>
                    <Text style={{ color: C.textMuted, fontSize: 15 }}>No messages yet. Say hi!</Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const isMine = item.sender_id === profile?.id;
                  const isSticker = item.content.startsWith('sticker:');
                  const stickerData = isSticker
                    ? STICKERS.find(s => s.id === item.content.slice('sticker:'.length))
                    : null;

                  if (isSticker && stickerData) {
                    return (
                      <View style={{
                        alignSelf: isMine ? 'flex-end' : 'flex-start',
                        marginBottom: 8, alignItems: isMine ? 'flex-end' : 'flex-start',
                      }}>
                        <Image
                          source={stickerData.source}
                          style={{ width: 100, height: 100 }}
                          contentFit="contain"
                        />
                        <Text style={{
                          color: C.textMuted, fontSize: 11, marginTop: 2,
                        }}>
                          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    );
                  }

                  return (
                    <View style={{
                      alignSelf: isMine ? 'flex-end' : 'flex-start',
                      maxWidth: '78%',
                      backgroundColor: isMine ? C.accent : C.bgElement,
                      borderRadius: 18,
                      borderBottomRightRadius: isMine ? 4 : 18,
                      borderBottomLeftRadius: isMine ? 18 : 4,
                      paddingHorizontal: 14, paddingVertical: 9,
                      marginBottom: 8,
                      borderWidth: isMine ? 0 : 1, borderColor: C.border,
                    }}>
                      <Text style={{ color: isMine ? '#fff' : C.text, fontSize: 15 }}>
                        {item.content}
                      </Text>
                      <Text style={{
                        color: isMine ? 'rgba(255,255,255,0.6)' : C.textMuted,
                        fontSize: 11, marginTop: 2, alignSelf: 'flex-end',
                      }}>
                        {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  );
                }}
              />
            )}

            {/* Sticker bar + input bar share one container so tab-bar clearance
                is applied once, not doubled */}
            <View style={{
              backgroundColor: C.bgElement,
              borderTopWidth: 1, borderTopColor: C.border,
              paddingBottom: keyboardVisible ? Math.max(insets.bottom, 4) : Math.max(insets.bottom, 10) + 80,
            }}>
              {/* Sticker bar — fixed height so it never gets squeezed */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ height: 64 }}
                contentContainerStyle={{ paddingHorizontal: 8, alignItems: 'center', gap: 4 }}
              >
                {STICKERS.map(sticker => (
                  <Pressable
                    key={sticker.id}
                    onPress={() => sendSticker(sticker.id)}
                    style={({ pressed }) => ({
                      width: 52, height: 52, borderRadius: 12,
                      backgroundColor: pressed ? C.bgElevated : C.bgInput,
                      alignItems: 'center', justifyContent: 'center',
                      marginHorizontal: 3,
                      opacity: pressed ? 0.7 : 1,
                    })}
                  >
                    <Image source={sticker.source} style={{ width: 38, height: 38 }} contentFit="contain" />
                  </Pressable>
                ))}
              </ScrollView>

              {/* Input bar */}
              <View style={{
                flexDirection: 'row', alignItems: 'flex-end',
                paddingHorizontal: 12, paddingTop: 4, paddingBottom: 8,
              }}>
              <TextInput
                style={{
                  flex: 1, backgroundColor: C.bgInput, color: C.text,
                  borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10,
                  fontSize: 15, borderWidth: 1, borderColor: C.border,
                  marginRight: 8, maxHeight: 100,
                }}
                placeholder="Message..."
                placeholderTextColor={C.textPlaceholder}
                value={messageText}
                onChangeText={setMessageText}
                multiline
              />
              <Pressable
                onPress={sendMessage}
                disabled={!messageText.trim() || sending}
                style={({ pressed }) => ({
                  width: 42, height: 42, borderRadius: 21, marginBottom: 1,
                  backgroundColor: messageText.trim() ? C.accent : C.bgElevated,
                  alignItems: 'center', justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                {sending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ color: messageText.trim() ? '#fff' : C.textMuted, fontSize: 20 }}>↑</Text>
                }
              </Pressable>
              </View>{/* end input bar */}
            </View>{/* end sticker+input wrapper */}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SlideScreen>
    );
  }

  // ── Inbox / search view ───────────────────────────────────────────────────
  const showingSearch = searchText.trim().length > 0;

  return (
    <SlideScreen index={1}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Header + search bar */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 12 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: C.text, marginBottom: 14 }}>
            Messages
          </Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: C.bgElement, borderRadius: 14,
            borderWidth: 1, borderColor: C.border,
            paddingHorizontal: 14, paddingVertical: 10,
          }}>
            <Text style={{ color: C.textMuted, fontSize: 16, marginRight: 8 }}>🔍</Text>
            <TextInput
              style={{ flex: 1, color: C.text, fontSize: 15 }}
              placeholder="Search friends..."
              placeholderTextColor={C.textPlaceholder}
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => setSearchText('')} hitSlop={8}>
                <Text style={{ color: C.textMuted, fontSize: 16 }}>✕</Text>
              </Pressable>
            )}
          </View>
        </View>

        {loadingChats ? (
          <ActivityIndicator style={{ flex: 1 }} color={C.accent} />
        ) : showingSearch ? (
          searchResults.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ color: C.textMuted, fontSize: 15 }}>No friends match "{searchText}"</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={f => String(f.id)}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => { setSearchText(''); setSelectedFriend(item); }}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: C.bgElement, borderRadius: 14,
                    padding: 14, marginBottom: 10,
                    borderWidth: 1, borderColor: C.border,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Avatar name={item.full_name} uri={item.avatar_url} size={46} />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={{ color: C.text, fontWeight: '600', fontSize: 16 }}>{item.full_name}</Text>
                    <Text style={{ color: C.textSecondary, fontSize: 14 }}>@{item.username}</Text>
                  </View>
                  <Text style={{ color: C.textMuted, fontSize: 22 }}>›</Text>
                </Pressable>
              )}
            />
          )
        ) : recentChats.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: C.textMuted, fontSize: 16, textAlign: 'center', paddingHorizontal: 40 }}>
              No conversations yet.{'\n'}Search for a friend above to start chatting.
            </Text>
          </View>
        ) : (
          <FlatList
            data={recentChats}
            keyExtractor={c => String(c.friend.id)}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setSelectedFriend(item.friend)}
                style={({ pressed }) => ({
                  flexDirection: 'row', alignItems: 'center',
                  backgroundColor: C.bgElement, borderRadius: 14,
                  padding: 14, marginBottom: 10,
                  borderWidth: 1, borderColor: C.border,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Avatar name={item.friend.full_name} uri={item.friend.avatar_url} size={50} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: C.text, fontWeight: '600', fontSize: 16 }} numberOfLines={1}>
                      {item.friend.full_name}
                    </Text>
                    <Text style={{ color: C.textMuted, fontSize: 12 }}>
                      {formatTime(item.lastMessageTime)}
                    </Text>
                  </View>
                  <Text style={{ color: C.textSecondary, fontSize: 14, marginTop: 2 }} numberOfLines={1}>
                    {item.lastMessageIsMine ? 'You: ' : ''}{item.lastMessage}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </SlideScreen>
  );
}
