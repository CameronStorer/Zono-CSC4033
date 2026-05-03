import { Tabs } from 'expo-router';
import { TabNavProvider } from '@/contexts/tab-nav-context';
import CustomTabBar from '@/components/tab-bar';

export default function AppLayout() {
  return (
    <TabNavProvider>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="map/index" />
        <Tabs.Screen name="settings/index" />
        <Tabs.Screen name="admin-panel/index" />
      </Tabs>
    </TabNavProvider>
  );
}
