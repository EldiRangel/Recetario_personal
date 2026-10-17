import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { ActivityIndicator, StyleSheet, View, useColorScheme } from 'react-native';

import { AppProvider, useApp } from '@/context/AppContext';
import { useTheme } from '@/hooks/use-theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { user, hydrated } = useApp();
  const theme = useTheme();

  // Espera a que se recuperen los datos guardados antes de decidir la ruta inicial.
  if (!hydrated) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.background },
      }}
    >
      {/* Rutas de autenticación: solo accesibles sin sesión */}
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
      </Stack.Protected>

      {/* Rutas de la app: solo accesibles con sesión iniciada */}
      <Stack.Protected guard={!!user}>
        {/* Pestañas principales: Inicio, Recetas, Grupos y Perfil */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Recetas */}
        <Stack.Screen name="recipes/new" options={{ title: 'Nueva Receta' }} />
        <Stack.Screen name="recipes/[id]" options={{ title: 'Detalle de la Receta' }} />
        <Stack.Screen name="recipes/[id]/edit" options={{ title: 'Editar Receta' }} />

        {/* Grupos */}
        <Stack.Screen name="groups/new" options={{ title: 'Nuevo Grupo' }} />
        <Stack.Screen name="groups/[id]" options={{ title: 'Detalle del Grupo' }} />
        <Stack.Screen name="groups/[id]/edit" options={{ title: 'Editar Grupo' }} />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
