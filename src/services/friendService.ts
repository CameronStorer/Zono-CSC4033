import { supabase } from '@/components/supabase';
import type {
    FriendPreview,
    FriendRequestRow,
    FriendshipRow,
    FriendRequestStatus,
    UserLocation
} from '@/types/friend';

export async function searchUserByUserName( searchText:string):Promise<UserLocation[]>{
    if(!searchText.trim()) return [];

    const {data, error} = await supabase
        .from('users')
        .select('id, username, full_name, bio, created_at, updated_at, last_lat, last_lng, last_online, location_sharing, email, phone_number, status')
        .ilike('username',`%${searchText}%`);
    
    if (error){
        console.log('searchUsersByUsername error:', error);
        throw error;
    };
    return data ?? [];

}

export async function sendFriendRequest (sender_ID: number, receiver_ID:number): Promise<FriendRequestRow|null>{
    const {data, error} = await supabase
        .from('friend_requests')
        .insert([
            {   sender_id : sender_ID,
                receiver_id : receiver_ID,
                status : 'pending'
            },
        ])
        .select() // give me 1 data back
        .single(); // in single not array

    if (error){
        console.log('sendFriendRequest error:', error);
        throw error;
    };
    return data
}

export async function getPendingRequest (userID: number): Promise<FriendRequestRow[]>{
    const {data, error} = await supabase
        .from('friend_requests')
        .select('*')
        .eq('receiver_id', userID)
        .eq('status', 'pending');

    if (error){
        console.log('getPendingRequest error:', error);
        throw error;
    };

    // return that data from that user if have, if not just []
    return data ?? []; 
}

export async function getSentRequests(userId: number): Promise<FriendRequestRow[]> {
  const { data, error } = await supabase
    .from('friend_requests')
    .select('*')
    .eq('sender_id', userId);

  if (error) {
    console.log('getSentRequests error:', error);
    throw error;
  }

  return data ?? [];
}

export async function updateFriendRequestStatus(
    requestId: number,
    status: FriendRequestStatus): Promise<FriendRequestRow | null> {

    const { data, error } = await supabase
        .from('friend_requests')
        .update({
        status: status,
        responded_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .select()
        .single();

    if (error) {
        console.log('updateFriendRequestStatus error:', error);
        throw error;
    }
    return data;
}

export async function acceptFriendRequest(requestId: number): Promise<FriendRequestRow | null> {
  const { data: requestRow, error: fetchError } = await supabase // data,error - property name from Supabase response
    .from('friend_requests') 
    .select('*')
    .eq('id', requestId)
    .single();

    if (fetchError) {
        console.log('acceptFriendRequest fetch error:', fetchError);
        throw fetchError;
    }

    if (!requestRow) {
        throw new Error('Friend request not found');
    }

    const acceptedRequest = await updateFriendRequestStatus(requestId, 'accepted');

    const { error: insertError } = await supabase.from('friendships').insert([
        {
        user_id: requestRow.sender_id,
        friend_id: requestRow.receiver_id,
        },
        {
        user_id: requestRow.receiver_id,
        friend_id: requestRow.sender_id,
        },
    ]);

    if (insertError) {
        console.log('acceptFriendRequest insert friendship error:', insertError);
        throw insertError;
    }
    return acceptedRequest;
}

export async function rejectFriendRequest(requestId: number): Promise<FriendRequestRow|null> {
    return updateFriendRequestStatus(requestId,'rejected');
}

export async function getFriendshipRows(userId: number): Promise<FriendshipRow[]> {
    const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .eq('user_id', userId);

    if (error) {
        console.log('getFriendshipRows error:', error);
        throw error;
    }

    return data ?? [];
}

export async function getFriendList(userId: number): Promise<FriendPreview[]> {
    const friendshipRows = await getFriendshipRows(userId);
    const friendIds = friendshipRows.map((row) => row.friend_id); // get the ID of all user friends

    if (friendIds.length === 0) return [];

    const { data, error } = await supabase
        .from('users')
        .select('id, username, full_name, last_lat, last_lng')
        .in('id', friendIds);

    if (error) {
        console.log('getFriendList error:', error);
        throw error;
    }

    return data ?? [];
}