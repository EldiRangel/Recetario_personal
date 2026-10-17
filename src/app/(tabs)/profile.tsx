import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Icon, Icons } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { EMAIL_REGEX, LIMITS } from '@/constants/validation';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/hooks/use-theme';
import { User } from '@/types';
import { pickAvatar } from '@/utils/avatar';

export default function ProfileScreen() {
  const { user } = useApp();

  if (!user) return <Redirect href="/login" />;

  return <ProfileForm user={user} />;
}

function ProfileForm({ user }: { user: User }) {
  const { users, updateProfile, deleteAccount, logout, recipes, groups } = useApp();
  const theme = useTheme();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const myRecipes = recipes.filter((r) => r.createdBy === user.id);
  const myGroups = groups.filter((g) => g.createdBy === user.id);

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const showSuccess = (text: string) => {
    setError('');
    setMessage(text);
    setTimeout(() => setMessage(''), 3000);
  };

  const handlePickAvatar = async () => {
    try {
      const uri = await pickAvatar();
      if (!uri) return; // El usuario canceló la selección.
      updateProfile({ avatar: uri });
      showSuccess('Foto de perfil actualizada.');
    } catch {
      Alert.alert('Permiso necesario', 'Concede acceso a tus fotos para poder elegir una imagen de perfil.');
    }
  };

  const handleRemoveAvatar = () => {
    updateProfile({ avatar: undefined });
    showSuccess('Foto de perfil eliminada.');
  };

  const handleSave = () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    setMessage('');
    setError('');

    if (!trimmedName || !trimmedEmail) {
      setError('Nombre y correo son obligatorios.');
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

    // El correo debe seguir siendo único entre las cuentas registradas.
    const emailTaken = users.some((u) => u.id !== user.id && u.email === trimmedEmail.toLowerCase());
    if (emailTaken) {
      setError('Ya existe una cuenta registrada con este correo.');
      return;
    }

    updateProfile({ name: trimmedName, email: trimmedEmail });
    showSuccess('Perfil actualizado correctamente.');
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar cuenta',
      '¿Estás seguro de que deseas borrar tu cuenta? Se eliminarán todas tus recetas y grupos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteAccount(),
        },
      ]
    );
  };

  return (
    <Screen scroll edges={['top']}>
      {/* Título de la pantalla */}
      <View style={styles.pageHeader}>
        <ThemedText type="title" style={styles.pageTitle}>
          Perfil
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Administra tu cuenta
        </ThemedText>
      </View>

      {/* Encabezado con avatar (toca la foto para cambiarla) */}
      <View style={styles.header}>
        <Pressable
          onPress={handlePickAvatar}
          accessibilityRole="button"
          accessibilityLabel="Cambiar foto de perfil"
          style={({ pressed }) => [styles.avatarWrapper, pressed && styles.avatarPressed]}
        >
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <ThemedText type="title" style={[styles.avatarText, { color: theme.onPrimary }]}>
                {initials}
              </ThemedText>
            </View>
          )}
          <View style={[styles.avatarBadge, { backgroundColor: theme.primary, borderColor: theme.background }]}>
            <Icon name={Icons.camera} size={13} color={theme.onPrimary} />
          </View>
        </Pressable>

        <ThemedText type="default" style={styles.userName}>
          {user.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {user.email}
        </ThemedText>

        <View style={styles.photoActions}>
          <Button title="Cambiar foto" icon={Icons.camera} variant="outline" size="sm" onPress={handlePickAvatar} />
          {user.avatar && (
            <Button title="Quitar foto" icon={Icons.close} variant="ghost" size="sm" onPress={handleRemoveAvatar} />
          )}
        </View>

        <View style={styles.stats}>
          <View style={[styles.stat, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold">{myRecipes.length}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Recetas
            </ThemedText>
          </View>
          <View style={[styles.stat, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="smallBold">{myGroups.length}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Grupos
            </ThemedText>
          </View>
        </View>
      </View>

      {/* Datos personales */}
      <Card style={styles.card}>
        <SectionHeader icon={Icons.person} title="Datos personales" />
        <Input
          label="Nombre completo"
          icon={Icons.person}
          value={name}
          onChangeText={setName}
          maxLength={LIMITS.userName.max}
        />
        <Input
          label="Correo electrónico"
          icon={Icons.profile}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          maxLength={LIMITS.email.max}
        />

        {error !== '' && (
          <View style={[styles.errorBox, { backgroundColor: theme.dangerSoft }]}>
            <Icon name={Icons.warning} size={16} color={theme.danger} />
            <ThemedText type="small" style={[styles.errorText, { color: theme.danger }]}>
              {error}
            </ThemedText>
          </View>
        )}

        {message !== '' && (
          <View style={[styles.messageBox, { backgroundColor: theme.primarySoft }]}>
            <Icon name={Icons.info} size={16} color={theme.primary} />
            <ThemedText type="small" style={[styles.messageText, { color: theme.primary }]}>
              {message}
            </ThemedText>
          </View>
        )}

        <Button title="Guardar cambios" icon={Icons.save} fullWidth onPress={handleSave} />
        <Button title="Cerrar sesión" icon={Icons.logout} variant="outline" fullWidth onPress={logout} />
      </Card>

      {/* Eliminar cuenta */}
      <Card style={[styles.card, styles.dangerCard, { borderColor: theme.danger }]}>
        <ThemedText type="small" themeColor="textSecondary">
          Al eliminar tu cuenta se borrarán permanentemente todas tus recetas y grupos. Esta acción no
          se puede deshacer.
        </ThemedText>
        <Button title="Eliminar mi cuenta" icon={Icons.delete} variant="danger" fullWidth onPress={handleDelete} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageHeader: {
    marginTop: Spacing.four,
    gap: Spacing.half,
  },
  pageTitle: {
    fontSize: 28,
    lineHeight: 34,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.three,
    marginBottom: Spacing.five,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.two,
  },
  avatarPressed: {
    opacity: 0.85,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 30,
    lineHeight: 36,
  },
  userName: {
    fontWeight: '600',
    fontSize: 18,
  },
  photoActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  stat: {
    minWidth: 90,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.md,
    gap: Spacing.half,
  },
  card: {
    gap: Spacing.three,
    marginBottom: Spacing.three,
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
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
  },
  messageText: {
    flex: 1,
  },
  dangerCard: {
    borderWidth: 1,
  },
});
