import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from './icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export type SectionHeaderProps = {
  icon?: IconName;
  title: string;
  right?: ReactNode;
};

/** Encabezado de sección con icono opcional. */
export function SectionHeader({ icon, title, right }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {icon && <Icon name={icon} size={16} />}
        <ThemedText type="smallBold" style={styles.title}>
          {title}
        </ThemedText>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  title: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 12,
  },
});
