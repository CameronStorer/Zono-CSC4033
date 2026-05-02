import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/theme';

export type ThemePreference = 'dark' | 'light' | 'system';
export type AppColors = typeof Colors.dark;

type ThemeContextType = {
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => Promise<void>;
  resolved: 'dark' | 'light';
  colors: AppColors;
};

const ThemeContext = createContext<ThemeContextType>({
  preference: 'system',
  setPreference: async () => {},
  resolved: 'dark',
  colors: Colors.dark,
});

const THEME_STORAGE_KEY = 'app_theme_preference';

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then(val => {
      if (val === 'dark' || val === 'light' || val === 'system') {
        setPreferenceState(val);
      }
    });
  }, []);

  const setPreference = async (p: ThemePreference) => {
    setPreferenceState(p);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, p);
  };

  const resolved: 'dark' | 'light' =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  return (
    <ThemeContext.Provider value={{ preference, setPreference, resolved, colors: Colors[resolved] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useAppTheme = () => useContext(ThemeContext);
