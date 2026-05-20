import { Stack } from 'expo-router';
import { TabNavProvider } from '@/contexts/tab-nav-context';

export default function AppLayout() {
  return (
    <TabNavProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />

        <Stack.Screen
          name="profile/index"
          options={{
            headerShown: false,
            presentation: 'transparentModal',
            gestureEnabled: true,
            animation: 'slide_from_bottom',
          }}
        />

        <Stack.Screen
          name="profile/[id]"
          options={{
            headerShown: false,
            presentation: 'transparentModal',
            gestureEnabled: true,
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
    </TabNavProvider>
  );
}