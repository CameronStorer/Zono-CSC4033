import { useEffect } from 'react'
import { useColorScheme } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { AuthProvider, useAuth } from '@/components/auth-context'
import { supabase } from '@/components/supabase';

// Handles redirects based on auth state + role
function RouteGuard() {
  const { session, role, loading } = useAuth()
  const router = useRouter()
  const segments = useSegments()

  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace('/(app)/map'); // This is the "bridge" to page after login
      }
    });
  }, []);

    return null
  }

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <RouteGuard />
          <Stack screenOptions={{ headerShown: false }}>
            {/* start with login before app */}
            <Stack.Screen name="(login)" />
            <Stack.Screen name="(app)" />
          </Stack>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  )
}