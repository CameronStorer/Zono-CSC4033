import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '@/components/supabase';
import type { Session, User } from '@supabase/supabase-js'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppState } from 'react-native'

const DEVICE_TOKEN_KEY = 'zono_device_token'

function generateToken(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

type Profile = {
  id: number
  uid: string
  username: string
  full_name: string
  role: 'user' | 'dev' | 'admin'
  avatar_url: string | null
  bio: string | null
  phone_number: string | null
  email: string | null
  status: string | null
  last_online: string | null
  location_sharing: string | null
  last_lat: number | null
  last_lng: number | null
}

type AuthContextType = {
  session: Session | null
  user: User | null
  profile: Profile | null
  role: string | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: (uid: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  role: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const profileRef = useRef<Profile | null>(null)

  // Fetch the public.users profile + role
  const fetchProfile = async (uid: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('uid', uid)
      .single()

    if (error) { console.error('Profile fetch error:', error.message); return }
    setProfile(data)
    profileRef.current = data
  }

  // Write a device token to DB and AsyncStorage so only one device stays signed in
  const registerDeviceToken = async (userId: number) => {
    const token = generateToken()
    await AsyncStorage.setItem(DEVICE_TOKEN_KEY, token)
    await supabase.from('users').update({ device_token: token }).eq('id', userId)
  }

  // Compare stored local token with DB; sign out if they diverge
  const verifyDeviceToken = async () => {
    const p = profileRef.current
    if (!p?.id) return

    const localToken = await AsyncStorage.getItem(DEVICE_TOKEN_KEY)
    if (!localToken) return

    const { data } = await supabase
      .from('users')
      .select('device_token')
      .eq('id', p.id)
      .single()

    if (data && data.device_token !== localToken) {
      // Another device has taken the session — sign this one out
      await supabase.auth.signOut()
    }
  }

  useEffect(() => {
    // Get session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) fetchProfile(session.user.id)
      else setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        if (session?.user) {
          await fetchProfile(session.user.id)
          if (event === 'SIGNED_IN' && profileRef.current?.id) {
            await registerDeviceToken(profileRef.current.id)
          }
        } else {
          setProfile(null)
          profileRef.current = null
        }
        setLoading(false)
      }
    )

    // Re-verify token whenever the app comes to foreground
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') verifyDeviceToken()
    })

    return () => {
      subscription.unsubscribe()
      appStateSub.remove()
    }
  }, [])

  // Set loading false once profile is fetched
  useEffect(() => {
    if (profile) setLoading(false)
  }, [profile])


  const router = useRouter()

  const signOut = async () => {
    await AsyncStorage.removeItem(DEVICE_TOKEN_KEY)
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
    profileRef.current = null
    router.replace('/(login)')
  }

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      profile,
      role: profile?.role ?? null,
      loading,
      signOut,
      refreshProfile: fetchProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// Clean hook to use anywhere in the app
export const useAuth = () => useContext(AuthContext)