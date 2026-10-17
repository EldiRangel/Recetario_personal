import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Icon, Icons } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { EMAIL_REGEX, LIMITS } from '@/constants/validation';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/hooks/use-theme';

export default function LoginScreen() {
  const { login } = useApp();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Escribe tu correo y tu contraseña.');
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    if (password.length > LIMITS.password.max) {
      setError(`La contraseña no puede superar ${LIMITS.password.max} caracteres.`);
      return;
    }
    // Si las credenciales son válidas, el estado global cambia y las rutas
    // protegidas redirigen automáticamente a la pantalla principal.
    if (!login(email, password)) {
      setError('Correo o contraseña incorrectos.');
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom']} contentStyle={styles.content}>
      <View style={styles.hero}>
        <View style={[styles.logo, { backgroundColor: theme.primarySoft }]}>
          <Icon name={Icons.restaurant} size={36} color={theme.primary} />
        </View>
        <ThemedText type="title" style={styles.appName}>
          Recetario
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.heroSubtitle}>
          Inicia sesión para administrar tus recetas y grupos
        </ThemedText>
      </View>

      <Card style={styles.form}>
        <Input
          label="Correo electrónico"
          icon={Icons.profile}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          placeholder="tu@correo.com"
          value={email}
          onChangeText={setEmail}
          maxLength={LIMITS.email.max}
        />
        <Input
          label="Contraseña"
          secureTextEntry
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleLogin}
          maxLength={LIMITS.password.max}
        />

        {error !== '' && (
          <View style={[styles.errorBox, { backgroundColor: theme.dangerSoft }]}>
            <Icon name={Icons.warning} size={16} color={theme.danger} />
            <ThemedText type="small" style={[styles.errorText, { color: theme.danger }]}>
              {error}
            </ThemedText>
          </View>
        )}

        <Button title="Iniciar sesión" size="lg" fullWidth onPress={handleLogin} />
      </Card>

      <View style={styles.footer}>
        <ThemedText type="small" themeColor="textSecondary">
          ¿No tienes cuenta?{' '}
        </ThemedText>
        <Link href="/register">
          <ThemedText type="smallBold" style={{ color: theme.primary }}>
            Regístrate aquí
          </ThemedText>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.five,
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.five,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  appName: {
    fontSize: 34,
    lineHeight: 40,
  },
  heroSubtitle: {
    textAlign: 'center',
    maxWidth: 300,
  },
  form: {
    width: '100%',
    maxWidth: 420,
    gap: Spacing.three,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
  },
  errorText: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.five,
  },
});
