import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://api.latechsmp.net'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc1ODY2NzYzLCJleHAiOjE5MzM1NDY3NjN9.jzCAiod983BBI34dpNoT4CegqRf5AN4kBCPJvNLtOM4'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NzU4NjY3NjMsImV4cCI6MTkzMzU0Njc2M30.vj1EOB6ghreO9oWe5Z0mkgMI8Mwi292dC4r10HcIRJQ'

// Create a storage object that uses AsyncStorage for React Native
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