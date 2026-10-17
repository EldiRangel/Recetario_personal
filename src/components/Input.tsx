import { useState } from 'react';
import { StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from './themed-text';
import { Icon, type IconName } from './ui/icon';

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;

  icon?: IconName;
 
  containerStyle?: StyleProp<ViewStyle>;
};

export function Input({ label, error, icon, style, containerStyle, onFocus, onBlur, ...props }: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? theme.danger : focused ? theme.primary : theme.border;

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
          {label}
        </ThemedText>
      )}
      <View style={[styles.field, { backgroundColor: theme.card, borderColor }]}>
        {icon && <Icon name={icon} size={18} color={focused ? theme.primary : theme.textSecondary} />}
        <TextInput
          style={[styles.input, { color: theme.text }, style]}
          placeholderTextColor={theme.textSecondary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
      </View>
      {error && (
        <ThemedText type="small" style={[styles.error, { color: theme.danger }]}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.one,
  },
  label: {
    marginLeft: Spacing.one,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.two + Spacing.one,
    fontSize: 15,
  },
  error: {
    marginLeft: Spacing.one,
  },
});
