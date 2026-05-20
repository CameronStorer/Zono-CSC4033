import { Tabs } from 'expo-router';
import CustomTabBar from '@/components/tab-bar';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="map/index" />
      <Tabs.Screen name="messages/index" />
      <Tabs.Screen name="ai-chat/index" />
      <Tabs.Screen name="scratch-map/index.tsx" />
      <Tabs.Screen name="settings/index" />
      <Tabs.Screen name="admin-panel/index" />
    </Tabs>
  );
}