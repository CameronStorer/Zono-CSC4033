import { useAuth } from '@/components/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { makeStyles } from './_style';
import { UserProfile } from '@/services/profileService';
import {
  FriendProfilePreview,
  FriendRelationshipStatus,
  getProfileFriendList,
  getRelationshipToUser,
  getUserProfileById,
  sendProfileFriendRequest,
  unsendProfileFriendRequest,
} from '@/services/friendProfileService';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {ActivityIndicator,Alert,Modal,ScrollView,Text,TextInput,TouchableOpacity,View,} from 'react-native';
import { createReport } from '@/services/reportService';

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
  requestedIds,
  actionLoadingId,
  onAddFriend,
  onUnsendRequest,
}: {
  friend: FriendProfilePreview;
  styles: ReturnType<typeof makeStyles>;
  requestedIds: number[];
  actionLoadingId: number | null;
  onAddFriend: (targetUserId: number) => void;
  onUnsendRequest: (targetUserId: number) => void;
}) {
  const isRequested = requestedIds.includes(Number(friend.id));
  const isLoadingThisFriend = actionLoadingId === Number(friend.id);

  function openFriendProfile() {
    router.push({
      pathname: '/profile/[id]',
      params: { id: String(friend.id) },
    });
  }

  return (
    <TouchableOpacity
      style={styles.friendRow}
      activeOpacity={0.75}
      onPress={openFriendProfile}
    >
      <View style={styles.friendAvatar}>
        {friend.avatar_url ? (
          <Image source={{ uri: friend.avatar_url }} style={styles.avatarImage} />
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

      {!friend.is_current_user_friend && (
        <TouchableOpacity
          activeOpacity={0.85}
          disabled={isLoadingThisFriend}
          onPress={() => {
            if (isRequested) {
              onUnsendRequest(Number(friend.id));
            } else {
              onAddFriend(Number(friend.id));
            }
          }}
        >
          {isRequested ? (
            <View style={styles.requestedSmallButton}>
              <Text style={styles.requestedSmallText}>
                {isLoadingThisFriend ? '...' : 'Requested'}
              </Text>
            </View>
          ) : (
            <LinearGradient
              colors={['#1EA7FF', '#3419E8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.smallAddButton}
            >
              <Text style={styles.smallAddText}>
                {isLoadingThisFriend ? '...' : '+ Add'}
              </Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

export default function FriendProfilePage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile: currentProfile } = useAuth();
  const { colors: C, resolved } = useAppTheme();
  const styles = useMemo(() => makeStyles(C), [resolved]);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<FriendProfilePreview[]>([]);
  const [relationship, setRelationship] = useState<FriendRelationshipStatus>('none');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [requestedIds, setRequestedIds] = useState<number[]>([]);
  const [rowActionLoadingId, setRowActionLoadingId] = useState<number | null>(null);

  async function loadProfilePage() {
    if (!id || !currentProfile?.id) {
      return;
    }

    try {
      setLoading(true);

      const targetUserId = Number(id);
      const currentUserId = Number(currentProfile.id);

      const [targetProfile, targetFriends, relation] = await Promise.all([
        getUserProfileById(targetUserId),
        getProfileFriendList(targetUserId, currentUserId),
        getRelationshipToUser(currentUserId, targetUserId),
      ]);

      setProfile(targetProfile);
      setFriends(targetFriends);
      setRelationship(relation);
    } catch (error) {
      console.log('FriendProfilePage load error:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {loadProfilePage();}, [id, currentProfile?.id]);

  async function handleProfileAction() {
    if (!currentProfile?.id || !profile?.id) {
      return;
    }

    try {
      setActionLoading(true);

      if (relationship === 'none') {
        await sendProfileFriendRequest(Number(currentProfile.id), Number(profile.id));
        setRelationship('pending_sent');
      } else if (relationship === 'pending_sent') {
        await unsendProfileFriendRequest(Number(currentProfile.id), Number(profile.id));
        setRelationship('none');
      }
    } catch (error) {
      console.log('profile friend action error:', error);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAddFriendFromRow(targetUserId: number) {
  if (!currentProfile?.id) {
    return;
  }

  try {
    setRowActionLoadingId(targetUserId);

    await sendProfileFriendRequest(Number(currentProfile.id), targetUserId);

    setRequestedIds((prev) =>
      prev.includes(targetUserId) ? prev : [...prev, targetUserId]
    );
  } catch (error) {
    console.log('friend row add request error:', error);
  } finally {
    setRowActionLoadingId(null);
  }
}

async function handleUnsendFriendFromRow(targetUserId: number) {
    if (!currentProfile?.id) {
      return;
    }

    try {
      setRowActionLoadingId(targetUserId);

      await unsendProfileFriendRequest(Number(currentProfile.id), targetUserId);

      setRequestedIds((prev) => prev.filter((id) => id !== targetUserId));
    } catch (error) {
      console.log('friend row unsend request error:', error);
    } finally {
      setRowActionLoadingId(null);
    }
  }

  function handleReportUser() {
    setReportReason('');
    setShowReportModal(true);
  }

  async function submitReport() {
    const trimmed = reportReason.trim();
    if (!trimmed || !currentProfile?.id || !profile?.id) {
      return;
    }

    try {
      setReportLoading(true);
      await createReport(
        Number(currentProfile.id),
        Number(profile.id),
        trimmed,
      );
      setShowReportModal(false);
      Alert.alert('Report Submitted', 'We will review this report.');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to submit report.');
    } finally {
      setReportLoading(false);
    }
  }

  function renderProfileActionButton() {
    if (relationship === 'self' || relationship === 'friends') {
      return null;
    }

    if (relationship === 'pending_sent') {
      return (
        <TouchableOpacity
          style={styles.requestedButton}
          activeOpacity={0.85}
          disabled={actionLoading}
          onPress={handleProfileAction}
        >
          <Text style={styles.requestedText}>
            {actionLoading ? 'Loading...' : 'Requested'}
          </Text>
        </TouchableOpacity>
      );
    }

    if (relationship === 'pending_received') {
      return (
        <TouchableOpacity
          style={styles.requestedButton}
          activeOpacity={0.85}
          disabled={true}
        >
          <Text style={styles.requestedText}>Request received</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        disabled={actionLoading}
        onPress={handleProfileAction}
      >
        <LinearGradient
          colors={['#1EA7FF', '#3419E8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileActionButton}
        >
          <Text style={styles.profileActionText}>
            {actionLoading ? 'Loading...' : '+ Add Friend'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

    function closeFriendProfile() {
      if (router.canDismiss()) {
        router.dismiss(1);
        return;
      }

      if (router.canGoBack()) {
        router.back();
        return;
      }
      router.dismissTo('/map');
    }

    return (
    <View style={styles.overlay}>
        <View style={styles.panel}>
        <TouchableOpacity style={styles.closeButton} onPress={closeFriendProfile}>
            <Text style={styles.closeButtonText}>×</Text>
        </TouchableOpacity>

        {loading ? (
            <View style={styles.center}>
            <ActivityIndicator color={C.accent} size="large" />
            <Text style={styles.message}>Loading profile...</Text>
            </View>
        ) : (
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

            {renderProfileActionButton()}

            <TouchableOpacity
              style={styles.reportButton}
              activeOpacity={0.7}
              disabled={reportLoading}
              onPress={handleReportUser}
            >
              <Text style={styles.reportButtonText}>
                {reportLoading ? 'Reporting...' : 'Report User'}
              </Text>
            </TouchableOpacity>

            <View style={styles.infoCard}>
                <Text style={styles.cardTitle}>Profile</Text>
                <Text style={styles.cardText}>
                Status: {profile?.status || 'No status'}
                </Text>
                <Text style={styles.cardText}>
                Location sharing: {profile?.location_sharing || 'Unknown'}
                </Text>
            </View>

            <View style={styles.infoCard}>
                <Text style={styles.cardTitle}>About</Text>
                <Text style={styles.cardText}>
                Bio: {profile?.bio || 'No bio yet'}
                </Text>
            </View>

            <Text style={styles.friendCountText}>{friends.length} friends</Text>

            <View style={styles.friendCard}>
                {friends.length === 0 ? (
                <Text style={styles.cardText}>No friends yet</Text>
                ) : (
                friends.map((friend) => (
                  <FriendRow
                    key={friend.id}
                    friend={friend}
                    styles={styles}
                    requestedIds={requestedIds}
                    actionLoadingId={rowActionLoadingId}
                    onAddFriend={handleAddFriendFromRow}
                    onUnsendRequest={handleUnsendFriendFromRow}
                  />
                ))
                )}
            </View>
            </ScrollView>
        )}
        </View>

        <Modal
          visible={showReportModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowReportModal(false)}
        >
          <View style={styles.reportModalOverlay}>
            <View style={styles.reportModalCard}>
              <Text style={styles.reportModalTitle}>Report User</Text>
              <TextInput
                style={styles.reportModalInput}
                placeholder="Reason for report..."
                placeholderTextColor={C.textPlaceholder}
                value={reportReason}
                onChangeText={setReportReason}
                multiline
                maxLength={100}
                autoFocus
              />
              <View style={styles.reportModalActions}>
                <TouchableOpacity
                  onPress={() => setShowReportModal(false)}
                  disabled={reportLoading}
                >
                  <Text style={styles.reportModalCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={submitReport}
                  disabled={reportLoading || !reportReason.trim()}
                >
                  <Text
                    style={[
                      styles.reportModalSubmit,
                      (!reportReason.trim() || reportLoading) && { opacity: 0.4 },
                    ]}
                  >
                    {reportLoading ? 'Submitting...' : 'Submit Report'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
    </View>
    );
}