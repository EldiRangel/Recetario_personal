

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#687076',
    background: '#F5F7FA',
    card: '#FFFFFF',
    backgroundElement: '#EDF0F4',
    backgroundSelected: '#DFE3E8',
    border: '#E3E8EE',
    primary: '#2F80ED',
    onPrimary: '#FFFFFF',
    primarySoft: '#E9F1FD',
    danger: '#E5484D',
    onDanger: '#FFFFFF',
    dangerSoft: '#FCEDEE',
    success: '#2F9E68',
    onSuccess: '#FFFFFF',
  },
  dark: {
    text: '#ECEDEF',
    textSecondary: '#9AA2AB',
    background: '#0B0C0E',
    card: '#15181C',
    backgroundElement: '#1D2126',
    backgroundSelected: '#2A2F36',
    border: '#252A31',
    primary: '#3E8DF5',
    onPrimary: '#FFFFFF',
    primarySoft: '#16283F',
    danger: '#E5484D',
    onDanger: '#FFFFFF',
    dangerSoft: '#2C1618',
    success: '#3AA76D',
    onSuccess: '#FFFFFF',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

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

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
