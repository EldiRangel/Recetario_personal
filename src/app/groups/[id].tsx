import { Alert, StyleSheet, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Icon, Icons } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/hooks/use-theme';
import { Recipe } from '@/types';

export default function GroupDetailScreen() {
  const { user, groups, recipes, removeRecipeFromGroup, deleteGroup } = useApp();
  const router = useRouter();
  const theme = useTheme();
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

  const groupRecipes: Recipe[] = recipes
    .filter((r) => r.createdBy === user.id && group.recipeIds.includes(r.id))
    .sort((a, b) => a.title.localeCompare(b.title));

  const handleRemoveRecipe = (recipe: Recipe) => {
    Alert.alert(
      'Quitar del grupo',
      `¿Quitar "${recipe.title}" del grupo "${group.name}"? La receta no se borrará, solo dejará de pertenecer a este grupo.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Quitar', onPress: () => removeRecipeFromGroup(recipe.id, group.id) },
      ]
    );
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Borrar grupo',
      `Al eliminar "${group.name}" se borrarán las recetas que solo pertenecen a este grupo. Las recetas que están en otros grupos solo se desvincularán de este.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            deleteGroup(group.id);
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/groups');
            }
          },
        },
      ]
    );
  };

  return (
    <Screen scroll>
      {/* Encabezado */}
      <Card style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View style={[styles.groupIcon, { backgroundColor: theme.primarySoft }]}>
            <Icon name={Icons.groups} size={24} color={theme.primary} />
          </View>
          <View style={styles.headerInfo}>
            <ThemedText type="title" style={styles.title}>
              {group.name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {groupRecipes.length} receta(s) asociada(s)
            </ThemedText>
          </View>
        </View>
        {group.description !== undefined && group.description !== '' && (
          <ThemedText type="default">{group.description}</ThemedText>
        )}
      </Card>

      {/* Recetas del grupo */}
      <Card style={styles.section}>
        <SectionHeader icon={Icons.recipes} title={`Recetas del grupo (${groupRecipes.length})`} />
        {groupRecipes.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            No hay recetas asociadas. Puedes asociar recetas desde el formulario de cada receta.
          </ThemedText>
        ) : (
          groupRecipes.map((recipe) => (
            <View key={recipe.id} style={[styles.recipeRow, { backgroundColor: theme.backgroundElement }]}>
              <Icon name={Icons.recipes} size={16} />
              <ThemedText type="default" style={styles.recipeName} numberOfLines={1}>
                {recipe.title}
              </ThemedText>
              <IconButton
                icon={Icons.close}
                size={16}
                accessibilityLabel={`Quitar ${recipe.title} del grupo`}
                onPress={() => handleRemoveRecipe(recipe)}
              />
            </View>
          ))
        )}
      </Card>

      {/* Acciones */}
      <View style={styles.actions}>
        <Button
          title="Editar grupo"
          icon={Icons.edit}
          fullWidth
          onPress={() => router.push(`/groups/${group.id}/edit`)}
          style={styles.actionButton}
        />
        <Button
          title="Borrar grupo"
          icon={Icons.delete}
          variant="danger"
          fullWidth
          onPress={handleDeleteGroup}
          style={styles.actionButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    gap: Spacing.three,
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
  },
  section: {
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.one,
    paddingVertical: Spacing.one,
    borderRadius: Radius.md,
  },
  recipeName: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  actionButton: {
    flex: 1,
  },
  notFound: {
    textAlign: 'center',
    marginTop: Spacing.six,
  },
});
