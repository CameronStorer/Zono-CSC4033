import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/components/supabase';
import type { Session, User } from '@supabase/supabase-js'
import { useRouter } from 'expo-router'

type Profile = {
  id: number
  uid: string
  username: string
  full_name: string
  role: 'user' | 'dev' | 'admin'
  avatar_url: string | null
}

type AuthContextType = {
  session: Session | null
  user: User | null
  profile: Profile | null
  role: string | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  role: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch the public.users profile + role
  const fetchProfile = async (uid: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('uid', uid)
      .single()

    if (error) console.error('Profile fetch error:', error.message)
    else setProfile(data)
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
      async (_event, session) => {
        setSession(session)
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Set loading false once profile is fetched
  useEffect(() => {
    if (profile) setLoading(false)
  }, [profile])


// Inside AuthProvider:
const router = useRouter()

const signOut = async () => {
  await supabase.auth.signOut()
  setProfile(null)
  setSession(null)
  router.replace('/(login)')  // ← add this line
}

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      profile,
      role: profile?.role ?? null,
      loading,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// Clean hook to use anywhere in the app
export const useAuth = () => useContext(AuthContext)