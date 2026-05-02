import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Navigation bar (used by (app)/_layout)
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    // Base surfaces
    bg: '#f2f2f7',
    bgElement: '#ffffff',
    bgElevated: '#f2f2f7',
    bgInput: '#ffffff',
    // Borders
    border: '#e5e5ea',
    borderMuted: '#d1d1d6',
    // Text
    text: '#1c1c1e',
    textSecondary: '#6c6c70',
    textMuted: '#aeaeb2',
    textPlaceholder: '#c7c7cc',
    // Accent
    accent: '#007AFF',
    accentBg: '#e8f4ff',
    accentBorder: '#007AFF',
    // Destructive
    destructive: '#ff3b30',
    destructiveBg: '#fff5f5',
    destructiveBorder: '#ffcdd2',
    // Map
    mapBottomCard: '#80e0db',
    mapButton: '#4da6ff',
    mapButtonBell: '#75d1ff',
    mapModalCard: '#ffffff',
    mapSearchBg: '#fafafa',
    mapSearchBorder: '#d9d9d9',
    mapResultBorder: '#f0f0f0',
    mapPolyline: '#15fbef',
    mapOpenSettingsBtn: '#15fbef',
    // Login
    loginHeaderBg: '#898989',
    loginAccentBg: '#1fa3fc',
    loginBoxBg: '#ffffff',
    loginBoxShadow: '#000000',
    loginInputBorder: '#898989',
    loginInputBg: '#ffffff',
    loginTitleText: '#898989',
    // Profile modal
    profilePanelBg: '#f4f4f4',
    profileCardBg: '#ffffff',
    // Admin chart
    chartFrom: '#f0f0f3',
    chartTo: '#e5e5ea',
    chartColor: '#6200ee',
    chartLabel: '#333333',
  },
  dark: {
    // Navigation bar
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    // Base surfaces
    bg: '#0a0a0f',
    bgElement: '#16161d',
    bgElevated: '#1f1f27',
    bgInput: '#0d0d14',
    // Borders
    border: '#222222',
    borderMuted: '#333333',
    // Text
    text: '#ffffff',
    textSecondary: '#B0B4BA',
    textMuted: '#666666',
    textPlaceholder: '#555555',
    // Accent
    accent: '#007AFF',
    accentBg: '#0d2a45',
    accentBorder: '#007AFF',
    // Destructive
    destructive: '#ff6b6b',
    destructiveBg: '#1a0a0a',
    destructiveBorder: '#5c1a1a',
    // Map
    mapBottomCard: '#1a3a38',
    mapButton: '#1e4d7a',
    mapButtonBell: '#164055',
    mapModalCard: '#16161d',
    mapSearchBg: '#1a1a22',
    mapSearchBorder: '#333333',
    mapResultBorder: '#222222',
    mapPolyline: '#15fbef',
    mapOpenSettingsBtn: '#0abab0',
    // Login
    loginHeaderBg: '#1a1a1a',
    loginAccentBg: '#0a2040',
    loginBoxBg: '#16161d',
    loginBoxShadow: '#000000',
    loginInputBorder: '#444444',
    loginInputBg: '#0a0a0f',
    loginTitleText: '#aaaaaa',
    // Profile modal
    profilePanelBg: '#16161d',
    profileCardBg: '#1f1f27',
    // Admin chart
    chartFrom: '#16161d',
    chartTo: '#1f1f27',
    chartColor: '#6200ee',
    chartLabel: '#ffffff',
  },
};

export type AppColors = typeof Colors.dark;

// Kept for backwards compat with existing useTheme() callers
export type ThemeColor = keyof AppColors;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
