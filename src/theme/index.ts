export type ThemeName = 'light' | 'dark';

export interface Theme {
  name: ThemeName;
  bg: string;
  surface: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentSoft: string;
  blue: string;
  danger: string;
  warning: string;
  tabBar: string;
  overlay: string;
}

export const themes: Record<ThemeName, Theme> = {
  light: {
    name: 'light',
    bg: '#F3F5F8',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    border: '#E4E8EE',
    text: '#12161C',
    muted: '#667085',
    accent: '#0F8F6B',
    accentSoft: '#E5F6F0',
    blue: '#2F6FED',
    danger: '#D14343',
    warning: '#B7791F',
    tabBar: '#FFFFFF',
    overlay: 'rgba(18, 22, 28, 0.45)',
  },
  dark: {
    name: 'dark',
    bg: '#0B0F14',
    surface: '#131A22',
    card: '#18212B',
    border: '#2A3542',
    text: '#F2F5F8',
    muted: '#8B97A6',
    accent: '#3DDC97',
    accentSoft: '#143528',
    blue: '#6EA8FF',
    danger: '#FF7A7A',
    warning: '#F5C14C',
    tabBar: '#10161D',
    overlay: 'rgba(0, 0, 0, 0.55)',
  },
};

export function getTheme(scheme?: string | null): Theme {
  return scheme === 'dark' ? themes.dark : themes.light;
}
