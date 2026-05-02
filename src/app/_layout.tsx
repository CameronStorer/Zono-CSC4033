import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { AuthProvider } from '@/components/auth-context';
import { supabase } from '@/components/supabase';
import { AppThemeProvider, useAppTheme } from '@/contexts/theme-context';

function RouteGuard() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.replace('/(app)/map');
      }
    });
  }, []);

  return null;
}

function InnerLayout() {
  const { resolved } = useAppTheme();

  return (
    <ThemeProvider value={resolved === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RouteGuard />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(login)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppThemeProvider>
        <InnerLayout />
      </AppThemeProvider>
    </SafeAreaProvider>
  );
}
