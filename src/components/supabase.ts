import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = 'https://api.latechsmp.net'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc1ODY2NzYzLCJleHAiOjE5MzM1NDY3NjN9.jzCAiod983BBI34dpNoT4CegqRf5AN4kBCPJvNLtOM4'

// Create a storage object that uses AsyncStorage for React Native
const storage = AsyncStorage

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
  },
})

// To import and use the supabase database system anywhere in the app,
// add this command to the boilerplate:
// import { supabase } from '@/db/supabase'