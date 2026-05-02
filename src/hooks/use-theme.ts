import { useAppTheme } from '@/contexts/theme-context';

export function useTheme() {
  return useAppTheme().colors;
}
