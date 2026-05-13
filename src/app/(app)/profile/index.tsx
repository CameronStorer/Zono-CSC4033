import { AppColors } from '@/constants/theme';
import { useAuth } from '@/components/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
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
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.15)',
    },
    panel: {
      flex: 1,
      marginTop: 90,
      backgroundColor: C.profilePanelBg,
      borderTopLeftRadius: 36,
      borderTopRightRadius: 36,
      paddingTop: 28,
      paddingHorizontal: 24,
      alignItems: 'center',
    },
    closeButton: {
      position: 'absolute',
      top: 20,
      right: 20,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: C.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    closeButtonText: {
      color: C.text,
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 30,
    },
    scrollView: {
      width: '100%',
      flex: 1,
    },
    scrollContent: {
      width: '100%',
      alignItems: 'center',
      paddingTop: 28,
      paddingBottom: 50,
    },
    avatarCircle: {
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor: C.bgElement,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 4,
      borderColor: C.bgElement,
      overflow: 'hidden',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 55,
    },
    initialsText: {
      color: '#fff',
      fontSize: 34,
      fontWeight: '900',
    },
    name: {
      fontSize: 34,
      fontWeight: '700',
      marginTop: 12,
      color: C.text,
      textAlign: 'center',
    },
    username: {
      fontSize: 20,
      color: C.textSecondary,
      marginBottom: 22,
      textAlign: 'center',
    },
    infoCard: {
      width: '100%',
      backgroundColor: C.profileCardBg,
      borderRadius: 24,
      padding: 20,
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 8,
      color: C.text,
    },
    cardText: {
      fontSize: 16,
      color: C.textSecondary,
      marginBottom: 4,
    },
    friendCountText: {
      width: '100%',
      fontSize: 20,
      fontWeight: '700',
      color: C.textSecondary,
      marginBottom: 14,
      marginTop: 4,
    },
    friendCard: {
      width: '100%',
      backgroundColor: C.profileCardBg,
      borderRadius: 28,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 16,
    },
    friendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
    },
    friendAvatar: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: C.bgElement,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      marginRight: 14,
    },
    friendAvatarImage: {
      width: '100%',
      height: '100%',
    },
    friendInfo: {
      flex: 1,
      justifyContent: 'center',
    },
    friendName: {
      fontSize: 18,
      fontWeight: '700',
      color: C.text,
    },
    friendMeta: {
      fontSize: 13,
      fontWeight: '600',
      color: C.textSecondary,
      marginTop: 2,
    },
  });

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

          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Profile</Text>
            <Text style={styles.cardText}>Status: {profile?.status || 'No status'}</Text>
            <Text style={styles.cardText}>
              Location sharing: {profile?.location_sharing || 'Unknown'}
            </Text>
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
