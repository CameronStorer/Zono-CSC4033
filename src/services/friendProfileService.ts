import { supabase } from '@/components/supabase';
import { UserProfile } from '@/services/profileService';
import { getFriendList } from '@/services/friendService';

export type FriendProfilePreview = UserProfile & {
  friend_count: number;
  mutual_count: number;
  is_current_user_friend: boolean;
};

const USER_SELECT =
  'id, uid, username, full_name, bio, avatar_url, email, phone_number, status, last_online, location_sharing, last_lat, last_lng';

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

export async function getProfileFriendList(profileUserId: number, currentUserId: number): Promise<FriendProfilePreview[]> {
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

    const mutualCount = thisFriendFriendIds.filter((id) => currentUserFriendSet.has(id)).length;

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

export async function canViewProfile( currentUserId: number,targetUserId: number): Promise<boolean> {
  if (currentUserId === targetUserId) {
    return true;
  }
  const currentUserFriends = await getFriendList(currentUserId);

  return currentUserFriends.some((friend) => Number(friend.id) === Number(targetUserId));
}