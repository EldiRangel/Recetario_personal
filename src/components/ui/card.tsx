import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type CardProps = ViewProps & {
  onPress?: () => void;
  /** Aplica padding interno (por defecto true). */
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Card({ children, onPress, padded = true, style, ...rest }: CardProps) {
  const theme = useTheme();

  const base: StyleProp<ViewStyle> = [
    styles.card,
    { backgroundColor: theme.card, borderColor: theme.border },
    padded && styles.padded,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={{ color: theme.backgroundSelected }}
        style={({ pressed }) => [base, pressed && styles.pressed, Platform.select({ web: styles.hoverable })]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={base} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04), 0 2px 8px rgba(16, 24, 40, 0.05)',
  },
  padded: {
    padding: Spacing.four,
  },
  pressed: {
    opacity: 0.85,
  },
  hoverable: {
    cursor: 'pointer',
  },
});
