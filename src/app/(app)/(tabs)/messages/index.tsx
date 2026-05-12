import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, Pressable, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { supabase } from '@/components/supabase';
import { useAuth } from '@/components/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { SlideScreen } from '@/components/slide-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

function Avatar({ name, uri, size }: { name: string; uri: string | null; size: number }) {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '?';
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
  const { colors: C, resolved } = useAppTheme();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!profile?.id) return;
    loadFriends();
  }, [profile?.id]);

  const loadFriends = async () => {
    if (!profile?.id) return;
    setLoadingFriends(true);
    try {
      const { data: rows, error: frErr } = await supabase
        .from('friendships')
        .select('friend_id')
        .eq('user_id', profile.id);
      if (frErr) throw frErr;
      const ids = (rows ?? []).map(r => r.friend_id);
      if (ids.length === 0) { setFriends([]); return; }
      const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, username, full_name, avatar_url')
        .in('id', ids);
      if (uErr) throw uErr;
      setFriends(users ?? []);
    } catch (e) {
      console.log('messages: loadFriends error', e);
    } finally {
      setLoadingFriends(false);
    }
  };

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
          if (isRelevant) {
            setMessages(prev => [...prev, msg]);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedFriend?.id]);

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
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({ sender_id: profile.id, receiver_id: selectedFriend.id, content })
        .select()
        .single();
      if (error) throw error;
      setMessages(prev => [...prev, data]);
    } catch (e) {
      console.log('messages: sendMessage error', e);
    } finally {
      setSending(false);
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
                  return (
                    <View style={{
                      alignSelf: isMine ? 'flex-end' : 'flex-start',
                      maxWidth: '78%',
                      backgroundColor: isMine ? C.accent : C.bgElement,
                      borderRadius: 18,
                      borderBottomRightRadius: isMine ? 4 : 18,
                      borderBottomLeftRadius: isMine ? 18 : 4,
                      paddingHorizontal: 14,
                      paddingVertical: 9,
                      marginBottom: 8,
                      borderWidth: isMine ? 0 : 1,
                      borderColor: C.border,
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

            {/* Input bar */}
            <View style={{
              flexDirection: 'row', alignItems: 'flex-end',
              paddingHorizontal: 12, paddingTop: 10,
              paddingBottom: Math.max(insets.bottom, 10) + 80,
              backgroundColor: C.bgElement,
              borderTopWidth: 1, borderTopColor: C.border,
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
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SlideScreen>
    );
  }

  // ── Friends list ──────────────────────────────────────────────────────────
  return (
    <SlideScreen index={1}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: C.text }}>Messages</Text>
        </View>

        {loadingFriends ? (
          <ActivityIndicator style={{ flex: 1 }} color={C.accent} />
        ) : friends.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: C.textMuted, fontSize: 16, textAlign: 'center', paddingHorizontal: 40 }}>
              Add friends on the Map tab to start messaging them.
            </Text>
          </View>
        ) : (
          <FlatList
            data={friends}
            keyExtractor={f => String(f.id)}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setSelectedFriend(item)}
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
                  <Text style={{ color: C.text, fontWeight: '600', fontSize: 16 }}>
                    {item.full_name}
                  </Text>
                  <Text style={{ color: C.textSecondary, fontSize: 14 }}>
                    @{item.username}
                  </Text>
                </View>
                <Text style={{ color: C.textMuted, fontSize: 22 }}>›</Text>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </SlideScreen>
  );
}
