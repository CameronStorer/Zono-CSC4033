import { supabase } from '@/components/supabase';

export async function getIncomingFriendRequests(currentUserId: number) {
  const { data, error } = await supabase
    .from('friend_requests')
    .select(`
      id,
      sender_id,
      receiver_id,
      status,
      created_at,
      responded_at,
      users:sender_id (
        id,
        username,
        full_name,
        avatar_url
      )
    `)
    .eq('receiver_id', currentUserId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data ?? [];
}

export async function acceptFriendRequest(
  requestId: number,
  currentUserId: number,
  senderId: number
) {
  const { error: requestError } = await supabase
    .from('friend_requests')
    .update({
      status: 'accepted',
      responded_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('receiver_id', currentUserId)
    .eq('sender_id', senderId)
    .eq('status', 'pending');

  if (requestError) throw requestError;

  const { error: friendshipError } = await supabase
    .from('friendships')
    .upsert(
      [
        {
          user_id: currentUserId,
          friend_id: senderId,
          status: 'active',
        },
      ],
      {
        onConflict: 'user_id,friend_id',
      }
    );

  if (friendshipError) throw friendshipError;
  }

export async function deleteFriendRequest(requestId: number) {
  const { error } = await supabase
    .from('friend_requests')
    .delete()
    .eq('id', requestId);

  if (error) throw error;
}