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

export default function RegisterScreen() {
  const { register } = useApp();
  const theme = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail || !password) {
      setError('Completa todos los campos.');
      return;
    }
    if (trimmedName.length < LIMITS.userName.min || trimmedName.length > LIMITS.userName.max) {
      setError(`El nombre debe tener entre ${LIMITS.userName.min} y ${LIMITS.userName.max} caracteres.`);
      return;
    }
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    if (trimmedEmail.length > LIMITS.email.max) {
      setError(`El correo no puede superar ${LIMITS.email.max} caracteres.`);
      return;
    }
    if (password.trim() === '') {
      setError('La contraseña no puede estar formada solo por espacios.');
      return;
    }
    if (password.length < LIMITS.password.min || password.length > LIMITS.password.max) {
      setError(`La contraseña debe tener entre ${LIMITS.password.min} y ${LIMITS.password.max} caracteres.`);
      return;
    }
    // Al registrarse, el estado global cambia y las rutas protegidas
    // redirigen automáticamente a la pantalla principal.
    const errorMessage = await register(name, email, password);
    if (errorMessage) {
      setError(errorMessage);
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom']} contentStyle={styles.content}>
      <View style={styles.hero}>
        <View style={[styles.logo, { backgroundColor: theme.primarySoft }]}>
          <Icon name={Icons.person} size={32} color={theme.primary} />
        </View>
        <ThemedText type="title" style={styles.appName}>
          Crear cuenta
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.heroSubtitle}>
          Únete y guarda todas tus recetas en un solo lugar
        </ThemedText>
      </View>

      <Card style={styles.form}>
        <Input
          label="Nombre completo"
          icon={Icons.person}
          autoComplete="name"
          placeholder="Tu nombre"
          value={name}
          onChangeText={setName}
          maxLength={LIMITS.userName.max}
        />
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
          placeholder={`De ${LIMITS.password.min} a ${LIMITS.password.max} caracteres`}
          value={password}
          onChangeText={setPassword}
          onSubmitEditing={handleRegister}
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

        <Button title="Crear cuenta" size="lg" fullWidth onPress={handleRegister} />
      </Card>

      <View style={styles.footer}>
        <ThemedText type="small" themeColor="textSecondary">
          ¿Ya tienes cuenta?{' '}
        </ThemedText>
        <Link href="/login">
          <ThemedText type="smallBold" style={{ color: theme.primary }}>
            Inicia sesión
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
    width: 64,
    height: 64,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  appName: {
    fontSize: 30,
    lineHeight: 36,
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
