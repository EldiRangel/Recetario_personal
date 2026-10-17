import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Icon, type IconName } from './ui/icon';

export type ButtonVariant = 'primary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  disabled?: boolean;
  
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const SIZES: Record<ButtonSize, { paddingV: number; paddingH: number; fontSize: number; iconSize: number }> = {
  sm: { paddingV: 7, paddingH: 14, fontSize: 13, iconSize: 14 },
  md: { paddingV: 11, paddingH: 18, fontSize: 15, iconSize: 17 },
  lg: { paddingV: 15, paddingH: 22, fontSize: 16, iconSize: 18 },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const theme = useTheme();
  const s = SIZES[size];

  const palette: Record<ButtonVariant, { bg: string; fg: string; border: string; ripple: string }> = {
    primary: { bg: theme.primary, fg: theme.onPrimary, border: theme.primary, ripple: 'rgba(255,255,255,0.25)' },
    outline: { bg: 'transparent', fg: theme.primary, border: theme.primary, ripple: theme.primarySoft },
    danger: { bg: theme.danger, fg: theme.onDanger, border: theme.danger, ripple: 'rgba(255,255,255,0.25)' },
    ghost: { bg: 'transparent', fg: theme.text, border: 'transparent', ripple: theme.backgroundSelected },
  };
  const colors = palette[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      android_ripple={{ color: colors.ripple, foreground: false }}
      style={({ pressed }) => [
        styles.base,
        {
          paddingVertical: s.paddingV,
          paddingHorizontal: s.paddingH,
          backgroundColor: colors.bg,
          borderColor: colors.border,
        },
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon && <Icon name={icon} size={s.iconSize} color={colors.fg} />}
      <Text style={[styles.text, { color: colors.fg, fontSize: s.fontSize }]} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.45,
  },
});
