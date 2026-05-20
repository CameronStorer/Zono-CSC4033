import { supabase } from '@/components/supabase'

export type UserProfile = {
    id: number;
    uid: string;
    username: string | null;
    full_name: string | null;
    bio: string | null;
    avatar_url: string | null;
    email: string | null;
    phone_number: string | null;
    status: string | null;
    last_online: string | null;
    is_online: boolean | null;
    last_seen: string | null;
    location_sharing: string | null;
    last_lat: number | null;
    last_lng: number | null;
};

export async function getCurrentUserProfile(): Promise<UserProfile |null>{
    const { data: {user}, error: authError } = await supabase.auth.getUser();

    if (authError) {
        console.log('getCurrentUserProfile authError:', authError);
        return null;
    }

    if (!user) {
        return null;
    }

    const {data, error} = await supabase
        .from('users')
        .select(
        'id, uid, username, full_name, bio, avatar_url, email, phone_number, status, last_online, is_online, last_seen, location_sharing, last_lat, last_lng')
        .eq('uid', user.id)
        .single(); // will return exactly 1 row from the users table 
    
    if (error) {
        console.log('getCurrentUserProfile error:', error);
        return null;
    }

    return data;
}

export async function updateUserLocation(userId: number, lat: number, lng: number): Promise<void> {
    const { error } = await supabase
        .from('users')
        .update({ last_lat: lat, last_lng: lng })
        .eq('id', userId);

    if (error) {
        console.log('updateUserLocation error: ', error);
    }
}
