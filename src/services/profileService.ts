import {supabase} from '@/components/supabase'

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
    location_sharing: string | null;
    last_lat: number | null;
    last_lng: number | null;
};

export async function getCurrentUserProfile(): Promise<UserProfile |null>{
    const {data: {user},error: authError} = await supabase.auth.getUser();

    if (authError) {
        console.log('get user error:', authError);
        return null;
    }

    if (!user){
        return null;
    }

    const {data, error} = await supabase
        .from('users')
        .select(
        'id, uid, username, full_name, bio, avatar_url, email, phone_number, status, last_online, location_sharing, last_lat, last_lng')
        .eq('uid', user.id)
        .single(); // make sure return exactly 1 row 
    
    if (error){
        console.log('get profile error:', error);
        return null;
    }
    return data;
}
