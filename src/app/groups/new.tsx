import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Icon, Icons } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { LIMITS } from '@/constants/validation';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/hooks/use-theme';

export default function NewGroupScreen() {
  const { user } = useApp();

  if (!user) return <Redirect href="/login" />;

  return <NewGroupForm />;
}

function NewGroupForm() {
  const { addGroup } = useApp();
  const router = useRouter();
  const theme = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    setError('');
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('El nombre del grupo es obligatorio.');
      return;
    }
    if (trimmedName.length < LIMITS.groupName.min || trimmedName.length > LIMITS.groupName.max) {
      setError(`El nombre debe tener entre ${LIMITS.groupName.min} y ${LIMITS.groupName.max} caracteres.`);
      return;
    }
    const ok = addGroup({
      name: name.trim(),
      description: description.trim() || undefined,
      recipeIds: [],
    });
    if (!ok) {
      setError('Ya existe un grupo con este nombre.');
      return;
    }
    // Regresar a la pantalla anterior 
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/groups');
    }
  };

  return (
    <Screen scroll>
      <ThemedText type="title" style={styles.pageTitle}>
        Nuevo grupo
      </ThemedText>

      {error !== '' && (
        <View style={[styles.errorBox, { backgroundColor: theme.dangerSoft }]}>
          <Icon name={Icons.warning} size={16} color={theme.danger} />
          <ThemedText type="small" style={[styles.errorText, { color: theme.danger }]}>
            {error}
          </ThemedText>
        </View>
      )}

      <Card style={styles.card}>
        <SectionHeader icon={Icons.groups} title="Datos del grupo" />
        <Input
          label="Nombre del grupo"
          placeholder="Ej. Cenas rápidas"
          value={name}
          onChangeText={setName}
          maxLength={LIMITS.groupName.max}
        />
        <Input
          label="Descripción (opcional)"
          placeholder="¿De qué trata este grupo?"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={styles.multiline}
          maxLength={LIMITS.groupDescription.max}
        />
      </Card>

      <Button title="Crear grupo" icon={Icons.save} size="lg" fullWidth onPress={handleSave} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    marginTop: Spacing.three,
    marginBottom: Spacing.four,
    fontSize: 28,
    lineHeight: 34,
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
    marginBottom: Spacing.three,
  },
  errorText: {
    flex: 1,
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
});
