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
  const { error } = await supabase.rpc('accept_friend_request', {
    p_request_id:      requestId,
    p_current_user_id: currentUserId,
    p_sender_id:       senderId,
  });

  if (error) throw error;
}

export async function deleteFriendRequest(requestId: number) {
  const { error } = await supabase
    .from('friend_requests')
    .delete()
    .eq('id', requestId);

  if (error) throw error;
}