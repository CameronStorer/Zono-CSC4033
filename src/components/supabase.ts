import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_KEY!

const storage = AsyncStorage

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
  },
})

// Service-role client — only for admin operations (user creation, etc.)
// Does NOT persist sessions so it never interferes with the logged-in user.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// To import and use the supabase database system anywhere in the app,
// add this command to the boilerplate:
// import { supabase } from '@/db/supabase'
