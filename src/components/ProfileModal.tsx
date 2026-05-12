import { UserProfile } from '@/services/profileService';
import React, { useEffect, useMemo, useState } from 'react';
import {Modal,View,Text,TouchableOpacity,StyleSheet,ScrollView,ActivityIndicator,} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAppTheme } from '@/contexts/theme-context';
import { AppColors } from '@/constants/theme';
import {FriendProfilePreview,getProfileFriendList,} from '@/services/friendProfileService';

type ProfileModalProps = {
  visible: boolean;
  onClose: () => void;
  profile: UserProfile | null;
};

const makeStyles = (C: AppColors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'transparent',
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
    panel: {
      minHeight: '82%',
      maxHeight: '88%',
      backgroundColor: C.profilePanelBg,
      borderTopLeftRadius: 36,
      borderTopRightRadius: 36,
      paddingTop: 28,
      paddingHorizontal: 24,
      alignItems: 'center',
    },

    scrollView: {
      width: '100%',
      flex: 1,
    },

    scrollContent: {
      width: '100%',
      alignItems: 'center',
      paddingTop: 28,
      paddingBottom: 40,
    },

    avatarCircle: {
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor: C.bgElement,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 0,
      borderWidth: 4,
      borderColor: C.bgElement,
      overflow: 'hidden',
    },
    
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 55,
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
    addButtonGradient: {
      minWidth: 96,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addButtonText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '800',
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

function FriendRow({friend,onPress,styles,}: {
  friend: FriendProfilePreview;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <TouchableOpacity style={styles.friendRow} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.friendAvatar}>
        {friend.avatar_url ? (
          <Image source={{ uri: friend.avatar_url }} style={styles.friendAvatarImage} />
        ) : (
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>
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

      {!friend.is_current_user_friend && (
        <TouchableOpacity activeOpacity={0.85}>
          <LinearGradient
            colors={['#1EA7FF', '#3419E8']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addButtonGradient}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function ProfileModal({ visible, onClose, profile }: ProfileModalProps) {
  const { colors: C, resolved } = useAppTheme();
  const styles = useMemo(() => makeStyles(C), [resolved]);

  const [friends, setFriends] = useState<FriendProfilePreview[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  useEffect(() => {
    async function loadFriends() {
      if (!visible || !profile?.id) {
        return;
      }

      try {
        setLoadingFriends(true);

        const data = await getProfileFriendList(
          Number(profile.id),
          Number(profile.id)
        );

        setFriends(data);
      } catch (error) {
        console.log('ProfileModal loadFriends error:', error);
        setFriends([]);
      } finally {
        setLoadingFriends(false);
      }
    }

    loadFriends();
  }, [visible, profile?.id]);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.panel}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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
                  <Text style={{ color: '#fff', fontSize: 36, fontWeight: 'bold' }}>
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
                  <FriendRow
                    key={friend.id}
                    friend={friend}
                    styles={styles}
                    onPress={() => {
                      router.push({
                          pathname: '/profile/[id]',
                          params: { id: String(friend.id) },
                      });
                    }}
                  />
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}