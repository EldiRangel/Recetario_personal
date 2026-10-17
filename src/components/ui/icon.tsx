import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { StyleProp, ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export type IconName = SymbolViewProps['name'];

/**
 * Nombres de iconos multiplataforma.
 * - `ios`: SF Symbols
 * - `android` / `web`: Material Symbols
 */
export const Icons = {
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  recipes: { ios: 'text.book.closed.fill', android: 'menu_book', web: 'menu_book' },
  groups: { ios: 'folder.fill', android: 'folder', web: 'folder' },
  profile: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
  add: { ios: 'plus', android: 'add', web: 'add' },
  edit: { ios: 'pencil', android: 'edit', web: 'edit' },
  delete: { ios: 'trash', android: 'delete', web: 'delete' },
  save: { ios: 'checkmark', android: 'check', web: 'check' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' },
  person: { ios: 'person.fill', android: 'person', web: 'person' },
  people: { ios: 'person.2.fill', android: 'groups', web: 'groups' },
  camera: { ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  ingredients: { ios: 'list.bullet', android: 'list', web: 'list' },
  steps: { ios: 'fork.knife', android: 'fork_spoon', web: 'fork_spoon' },
  time: { ios: 'timer', android: 'timer', web: 'timer' },
  warning: { ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' },
  info: { ios: 'info.circle', android: 'info', web: 'info' },
  restaurant: { ios: 'takeoutbag.and.cup.and.straw.fill', android: 'restaurant', web: 'restaurant' },
  bookmark: { ios: 'bookmark.fill', android: 'bookmark', web: 'bookmark' },
} as const;

export type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function Icon({ name, size = 20, color, style }: IconProps) {
  const theme = useTheme();

  return <SymbolView name={name} size={size} tintColor={color ?? theme.text} style={style} />;
}
