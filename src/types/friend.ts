export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export type UserLocation = {
    id: number;
    username: string;
    full_name?: string | null;
    bio?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    last_lat?: number | null;
    last_lng?: number | null;
    last_online?: string | null;
    location_sharing?: string | null;
    email?: string | null;
    phone_number?: number | null;
    status?: string | null;
};

export type FriendRequestRow = {
    id: number;
    created_at?: string | null;
    sender_id: number;
    receiver_id: number;
    status: FriendRequestStatus;
    responded_at?: string | null;
};

export type FriendshipRow = {
    id: number;
    created_at?: string | null;
    user_id: number;
    friend_id: number;
    status?: FriendRequestStatus | null;
};

//shorter vesion user information
export type FriendPreview = {
    id: number;
    username: string;
    full_name?: string | null;
    last_lat?: number | null;
    last_lng?: number | null;
};