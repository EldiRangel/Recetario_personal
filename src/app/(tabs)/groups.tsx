import { Alert, StyleSheet, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icons } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { Group } from '@/types';

export default function GroupsIndexScreen() {
  const { user, groups, deleteGroup } = useApp();
  const router = useRouter();

  if (!user) return <Redirect href="/login" />;

  const myGroups = [...groups]
    .filter((g) => g.createdBy === user.id)
    .sort((a, b) => a.name.localeCompare(b.name));

  const handleDelete = (group: Group) => {
    Alert.alert(
      'Borrar grupo',
      `Al eliminar "${group.name}" se borrarán las recetas que solo pertenecen a este grupo. Las recetas compartidas con otros grupos se desvincularán de este.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteGroup(group.id) },
      ]
    );
  };

  return (
    <Screen scroll edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <ThemedText type="title" style={styles.headerTitle}>
            Grupos
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {myGroups.length} grupo(s) · ordenados alfabéticamente
          </ThemedText>
        </View>
        <Button title="Nuevo" icon={Icons.add} onPress={() => router.push('/groups/new')} />
      </View>

      {myGroups.length === 0 ? (
        <EmptyState
          icon={Icons.groups}
          title="Aún no tienes grupos"
          description="Agrupa tus recetas por tema: cenas rápidas, postres, favoritos..."
          action={<Button title="Crear grupo" icon={Icons.add} onPress={() => router.push('/groups/new')} />}
        />
      ) : (
        <View style={styles.list}>
          {myGroups.map((group) => (
            <Card key={group.id} onPress={() => router.push(`/groups/${group.id}`)} style={styles.card}>
              <View style={styles.row}>
                <View style={styles.info}>
                  <ThemedText type="default" style={styles.title} numberOfLines={1}>
                    {group.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {group.recipeIds.length} receta(s)
                    {group.description ? ` · ${group.description}` : ''}
                  </ThemedText>
                </View>
                <IconButton
                  icon={Icons.edit}
                  accessibilityLabel={`Editar ${group.name}`}
                  onPress={() => router.push(`/groups/${group.id}/edit`)}
                />
                <IconButton
                  icon={Icons.delete}
                  accessibilityLabel={`Borrar ${group.name}`}
                  onPress={() => handleDelete(group)}
                />
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    marginTop: Spacing.three,
    marginBottom: Spacing.four,
  },
  headerText: {
    flex: 1,
    gap: Spacing.half,
  },
  headerTitle: {
    fontSize: 28,
    lineHeight: 34,
  },
  list: {
    gap: Spacing.two,
  },
  card: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  info: {
    flex: 1,
    gap: Spacing.half,
    paddingRight: Spacing.two,
  },
  title: {
    fontWeight: '600',
  },
});
