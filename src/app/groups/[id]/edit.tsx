import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

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
import { Group } from '@/types';

export default function GroupEditScreen() {
  const { user, groups } = useApp();
  const params = useLocalSearchParams<{ id: string }>();

  if (!user) return <Redirect href="/login" />;

  const group = groups.find((g) => g.id === params.id && g.createdBy === user.id);
  if (!group) {
    return (
      <Screen scroll>
        <ThemedText type="title" style={styles.notFound}>
          Grupo no encontrado
        </ThemedText>
      </Screen>
    );
  }

  return <GroupEditForm group={group} />;
}

function GroupEditForm({ group }: { group: Group }) {
  const { updateGroup } = useApp();
  const router = useRouter();
  const theme = useTheme();
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? '');
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
    const ok = updateGroup(group.id, {
      name: name.trim(),
      description: description.trim() || undefined,
    });
    if (!ok) {
      setError('Ya existe otro grupo con este nombre.');
      return;
    }
    router.dismissTo(`/groups/${group.id}`);
  };

  return (
    <Screen scroll>
      <ThemedText type="title" style={styles.pageTitle}>
        Editar grupo
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
        <Input label="Nombre del grupo" value={name} onChangeText={setName} maxLength={LIMITS.groupName.max} />
        <Input
          label="Descripción"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={styles.multiline}
          maxLength={LIMITS.groupDescription.max}
        />
      </Card>

      <Button title="Guardar cambios" icon={Icons.save} size="lg" fullWidth onPress={handleSave} />
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
  notFound: {
    textAlign: 'center',
    marginTop: Spacing.six,
  },
});
