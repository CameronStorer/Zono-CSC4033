import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/contexts/theme-context';
import { useAuth } from '@/components/auth-context';
import { Map, Eraser, MessageCircle, Sparkles, Settings, Database } from 'lucide-react-native';

type TabConfig = {
  label: string;
  Icon: React.ComponentType<{ color: string; size: number; strokeWidth?: number }>;
};

const TAB_CONFIG: Record<string, TabConfig> = {
  'map/index':            { label: 'Map',        Icon: Map },
  'messages/index':       { label: 'Messages',   Icon: MessageCircle },
  'ai-chat/index':        { label: 'AI Chat',    Icon: Sparkles },
  'scratch-map/index':    { label: 'Scratch Map', Icon: Eraser },
  'scratch-map/index.tsx':{ label: 'Scratch Map', Icon: Eraser },
  'settings/index':       { label: 'Settings',   Icon: Settings },
  'admin-panel/index':    { label: 'Admin',       Icon: Database },
};

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors: C } = useAppTheme();
  const { role } = useAuth();
  const insets = useSafeAreaInsets();

  const visibleRoutes = state.routes.filter(route => {
    if (route.name === 'admin-panel/index') return role === 'admin';
    return route.name in TAB_CONFIG;
  });

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      <View style={[styles.bar, { backgroundColor: C.bgElement }]}>
        {visibleRoutes.map(route => {
          const isFocused = state.routes[state.index].name === route.name;
          const { Icon } = TAB_CONFIG[route.name];

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={({ pressed }) => [styles.tab, pressed && { opacity: 0.6 }]}
            >
              <View style={[styles.iconPill, isFocused && { backgroundColor: C.accentBg }]}>
                <Icon
                  color={isFocused ? C.accent : C.textMuted}
                  size={24}
                  strokeWidth={isFocused ? 2.2 : 1.8}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 15,
    left: 16,
    right: 16,
  },
  bar: {
    flexDirection: 'row',
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconPill: {
    width: '85%',
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
