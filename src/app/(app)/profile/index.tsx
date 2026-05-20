import { useAuth } from '@/components/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { makeStyles } from './_style';
import {
  FriendProfilePreview,
  getProfileFriendList,
} from '@/services/friendProfileService';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

function getInitials(name?: string | null, username?: string | null) {
  const value = name || username || '?';

  return value
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function FriendRow({
  friend,
  styles,
}: {
  friend: FriendProfilePreview;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <TouchableOpacity
      style={styles.friendRow}
      activeOpacity={0.75}
      onPress={() => {
        router.push({
          pathname: '/profile/[id]',
          params: { id: String(friend.id) },
        });
      }}
    >
      <View style={styles.friendAvatar}>
        {friend.avatar_url ? (
          <Image source={{ uri: friend.avatar_url }} style={styles.friendAvatarImage} />
        ) : (
          <Text style={styles.initialsText}>
            {getInitials(friend.full_name, friend.username)}
          </Text>
        )}
      </View>

      <View style={styles.friendInfo}>
        <Text style={styles.friendName} numberOfLines={1}>
          {friend.full_name || friend.username || 'Unknown User'}
        </Text>

        <Text style={styles.friendMeta} numberOfLines={1}>
          {friend.friend_count} friends ({friend.mutual_count} mutual)
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function OwnProfilePage() {
  const { profile } = useAuth();
  const { colors: C, resolved } = useAppTheme();
  const styles = useMemo(() => makeStyles(C), [resolved]);

  const [friends, setFriends] = useState<FriendProfilePreview[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  useEffect(() => {
    async function loadFriends() {
      if (!profile?.id) {
        return;
      }

      try {
        setLoadingFriends(true);
        const data = await getProfileFriendList(Number(profile.id), Number(profile.id));
        setFriends(data);
      } catch (error) {
        console.log('OwnProfilePage loadFriends error:', error);
        setFriends([]);
      } finally {
        setLoadingFriends(false);
      }
    }

    loadFriends();
  }, [profile?.id]);

  function closeOwnProfile() {
    if (router.canDismiss()) {
      router.dismiss(1);
      return;
    }

    router.dismissTo('/map');
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <TouchableOpacity style={styles.closeButton} onPress={closeOwnProfile}>
          <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarCircle}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: C.accent,
                  borderRadius: 55,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={styles.initialsText}>
                  {getInitials(profile?.full_name, profile?.username)}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.name}>{profile?.full_name || 'Unknown User'}</Text>
          <Text style={styles.username}>@{profile?.username || 'username'}</Text>

          <View style={styles.presenceBadge}>
            <View style={[styles.presenceDot, { backgroundColor: '#34C759' }]} />
            <Text style={styles.presenceText}>Active now</Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>About</Text>
            <Text style={styles.cardText}>Bio: {profile?.bio || 'No bio yet'}</Text>
          </View>

          <Text style={styles.friendCountText}>{friends.length} friends</Text>

          <View style={styles.friendCard}>
            {loadingFriends ? (
              <ActivityIndicator color={C.accent} />
            ) : friends.length === 0 ? (
              <Text style={styles.cardText}>No friends yet</Text>
            ) : (
              friends.map((friend) => (
                <FriendRow key={friend.id} friend={friend} styles={styles} />
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
