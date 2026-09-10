import { Platform } from 'react-native';

export const colors = {
  background: '#08090C',
  surface: '#111318',
  surfaceElevated: '#171A21',
  surfaceGlass: 'rgba(255,255,255,0.07)',
  surfaceGlassStrong: 'rgba(255,255,255,0.11)',

  text: '#FFFFFF',
  textSecondary: '#A7ABB5',
  textMuted: '#6F7480',

  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.16)',

  accent: '#E30613',
  accentSoft: 'rgba(227,6,19,0.16)',

  success: '#35C759',
  warning: '#FFB340',
  info: '#5AA9FF',

  white: '#FFFFFF',
  black: '#000000',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.30,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
    },
    android: {
      elevation: 8,
    },
    default: {},
  }),
};

export const typography = {
  hero: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700' as const,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700' as const,
  },
  section: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700' as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.8,
  },
};
