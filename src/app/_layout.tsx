import { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider } from '@/components/auth-context';
import { supabase } from '@/components/supabase';
import { AppThemeProvider, useAppTheme } from '@/contexts/theme-context';

function RouteGuard() {
  const router = useRouter();
  const segments = useSegments();
  const segmentsRef = useRef(segments);

  useEffect(() => {
    segmentsRef.current = segments;
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const inApp = segmentsRef.current[0] === '(app)';
      if (event === 'SIGNED_IN' && session && !inApp) {
        router.replace('/(app)/(tabs)/map');
      } else if (event === 'SIGNED_OUT' && inApp) {
        router.replace('/(login)');
      }
    });
    return () => subscription.unsubscribe();
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
