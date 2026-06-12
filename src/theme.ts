import { useObdStore } from './store/obdStore';

export type ThemeColors = {
  bg: string;
  surface: string;
  surface2: string;
  accent: string;
  accentSoft: string;
  onAccent: string;
  border: string;
  text: string;
  muted: string;
  muted2: string;
  good: string;
  amber: string;
  red: string;
};

export const darkTheme: ThemeColors = {
  bg: '#0a0e14',
  surface: '#121821',
  surface2: '#1a212c',
  accent: '#3ddc97',
  accentSoft: 'rgba(61,220,151,0.14)',
  onAccent: '#07140d',
  border: 'rgba(255,255,255,0.07)',
  text: '#eef3f6',
  muted: 'rgba(225,235,240,0.6)',
  muted2: 'rgba(235,240,245,0.26)',
  good: '#34d399',
  amber: '#fbbf24',
  red: '#fb6a5e',
};

export const lightTheme: ThemeColors = {
  bg: '#F2F2F7',
  surface: '#FFFFFF',
  surface2: '#E8E8ED',
  accent: '#18a062',
  accentSoft: 'rgba(24,160,98,0.12)',
  onAccent: '#FFFFFF',
  border: 'rgba(0,0,0,0.09)',
  text: '#1a1a1a',
  muted: 'rgba(60,60,67,0.55)',
  muted2: 'rgba(60,60,67,0.28)',
  good: '#16a34a',
  amber: '#d97706',
  red: '#dc2626',
};

export function useTheme(): ThemeColors {
  const isDarkMode = useObdStore(s => s.isDarkMode);
  return isDarkMode ? darkTheme : lightTheme;
}

// Static fallback (dark) for non-reactive contexts
export const T = darkTheme;
