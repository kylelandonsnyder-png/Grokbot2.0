import { useColorScheme } from '@/components/useColorScheme';
import { getTheme, type Theme } from '@/src/theme';

export function useTheme(): Theme {
  return getTheme(useColorScheme());
}
