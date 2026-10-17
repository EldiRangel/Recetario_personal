import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from './icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type IconButtonProps = {
  icon: IconName;
  onPress?: () => void;
  color?: string;
  size?: number;
  /** Color de fondo del botón (por defecto transparente). */
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/** Botón compacto con solo un icono. */
export function IconButton({
  icon,
  onPress,
  color,
  size = 18,
  backgroundColor,
  style,
  accessibilityLabel,
}: IconButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      disabled={!onPress}
      android_ripple={{ color: theme.backgroundSelected, borderless: true }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: backgroundColor ?? 'transparent' },
        pressed && styles.pressed,
        style,
      ]}
    >
      <Icon name={icon} size={size} color={color ?? theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.two,
    borderRadius: Radius.full,
  },
  pressed: {
    opacity: 0.6,
  },
});
