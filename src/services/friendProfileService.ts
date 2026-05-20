import { supabase } from '@/components/supabase';
import { UserProfile } from '@/services/profileService';
import {cancelFriendRequest,getFriendList,sendFriendRequest,} from '@/services/friendService';

export type FriendRelationshipStatus =
  | 'self'
  | 'friends'
  | 'pending_sent'
  | 'pending_received'
  | 'none';

export type FriendProfilePreview = UserProfile & {
  friend_count: number;
  mutual_count: number;
  is_current_user_friend: boolean;
};

const USER_SELECT =
  'id, uid, username, full_name, bio, avatar_url, email, phone_number, status, last_online, is_online, last_seen, location_sharing, last_lat, last_lng';

export async function getUserProfileById(userId: number): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('users')
    .select(USER_SELECT)
    .eq('id', userId)
    .single();

  if (error) {
    console.log('getUserProfileById error:', error);
    throw error;
  }

  return data;
}

export async function getRelationshipToUser(currentUserId: number,targetUserId: number): Promise<FriendRelationshipStatus> {
  if (currentUserId === targetUserId) {
    return 'self';
  }

  const currentUserFriends = await getFriendList(currentUserId);
  const isFriend = currentUserFriends.some((friend) => Number(friend.id) === Number(targetUserId));

  if (isFriend) {
    return 'friends';
  }

  const { data: sentRequest, error: sentError } = await supabase
    .from('friend_requests')
    .select('id')
    .eq('sender_id', currentUserId)
    .eq('receiver_id', targetUserId)
    .eq('status', 'pending')
    .maybeSingle();

  if (sentError) {
    console.log('getRelationshipToUser sent request error:', sentError);
    throw sentError;
  }

  if (sentRequest) {
    return 'pending_sent';
  }

  const { data: receivedRequest, error: receivedError } = await supabase
    .from('friend_requests')
    .select('id')
    .eq('sender_id', targetUserId)
    .eq('receiver_id', currentUserId)
    .eq('status', 'pending')
    .maybeSingle();

  if (receivedError) {
    console.log('getRelationshipToUser received request error:', receivedError);
    throw receivedError;
  }

  if (receivedRequest) {
    return 'pending_received';
  }

  return 'none';
}

export async function sendProfileFriendRequest(currentUserId: number,targetUserId: number): Promise<void> {
  await sendFriendRequest(currentUserId, targetUserId);
}

export async function unsendProfileFriendRequest(currentUserId: number,targetUserId: number): Promise<void> {
  await cancelFriendRequest(currentUserId, targetUserId);
}

export async function getProfileFriendList(profileUserId: number,currentUserId: number): Promise<FriendProfilePreview[]> {
  const profileFriends = await getFriendList(profileUserId);
  const currentUserFriends = await getFriendList(currentUserId);

  const profileFriendIds = profileFriends.map((friend) => Number(friend.id));
  const currentUserFriendIds = currentUserFriends.map((friend) => Number(friend.id));
  const currentUserFriendSet = new Set(currentUserFriendIds);

  if (profileFriendIds.length === 0) {
    return [];
  }

  const { data: fullFriendProfiles, error: fullProfileError } = await supabase
    .from('users')
    .select(USER_SELECT)
    .in('id', profileFriendIds);

  if (fullProfileError) {
    console.log('getProfileFriendList full profiles error:', fullProfileError);
    throw fullProfileError;
  }

  const { data: friendCountRows, error: countError } = await supabase
    .from('friendships')
    .select('user_id, friend_id')
    .in('user_id', profileFriendIds);

  if (countError) {
    console.log('getProfileFriendList count error:', countError);
    throw countError;
  }

  return (fullFriendProfiles ?? []).map((friend) => {
    const rowsForThisFriend =
      friendCountRows?.filter((row) => Number(row.user_id) === Number(friend.id)) ?? [];

    const thisFriendFriendIds = rowsForThisFriend.map((row) => Number(row.friend_id));

    const mutualCount = thisFriendFriendIds.filter((id) =>
      currentUserFriendSet.has(id)
    ).length;

    return {
      ...friend,
      friend_count: thisFriendFriendIds.length,
      mutual_count: mutualCount,
      is_current_user_friend:
        currentUserFriendSet.has(Number(friend.id)) ||
        Number(friend.id) === currentUserId,
    };
  });
}