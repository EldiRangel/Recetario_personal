import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ScreenProps = {
  children: ReactNode;
  /** Envuelve el contenido en un ScrollView. */
  scroll?: boolean;
  /** Bordes del área segura que se deben respetar. Por defecto solo el inferior. */
  edges?: Edge[];
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Contenedor estándar de pantalla:
 * - aplica el color de fondo del tema
 * - respeta las safe areas
 * - limita el ancho del contenido en tablets y web (MaxContentWidth)
 */
export function Screen({ children, scroll = false, edges, style, contentStyle }: ScreenProps) {
  const theme = useTheme();

  const inner = <View style={[styles.content, contentStyle]}>{children}</View>;

  return (
    <SafeAreaView
      edges={edges ?? ['bottom']}
      style={[styles.safe, { backgroundColor: theme.background }, style]}
    >
      {scroll ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    flexGrow: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.five,
  },
});
