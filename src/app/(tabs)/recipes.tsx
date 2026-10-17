import { Alert, StyleSheet, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, Icons } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/hooks/use-theme';
import { Recipe } from '@/types';

export default function RecipesIndexScreen() {
  const { user, recipes, deleteRecipe } = useApp();
  const router = useRouter();

  if (!user) return <Redirect href="/login" />;

  const myRecipes = [...recipes]
    .filter((r) => r.createdBy === user.id)
    .sort((a, b) => a.title.localeCompare(b.title));

  const handleDelete = (recipe: Recipe) => {
    Alert.alert('Borrar receta', `¿Deseas eliminar "${recipe.title}"? Se desvinculará de todos los grupos.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteRecipe(recipe.id) },
    ]);
  };

  return (
    <Screen scroll edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <ThemedText type="title" style={styles.headerTitle}>
            Mis recetas
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {myRecipes.length} receta(s) · ordenadas alfabéticamente
          </ThemedText>
        </View>
        <Button title="Nueva" icon={Icons.add} onPress={() => router.push('/recipes/new')} />
      </View>

      {myRecipes.length === 0 ? (
        <EmptyState
          icon={Icons.recipes}
          title="Aún no tienes recetas"
          description="Crea tu primera receta con sus ingredientes y pasos."
          action={
            <Button title="Crear receta" icon={Icons.add} onPress={() => router.push('/recipes/new')} />
          }
        />
      ) : (
        <View style={styles.list}>
          {myRecipes.map((recipe) => (
            <Card
              key={recipe.id}
              onPress={() => router.push(`/recipes/${recipe.id}`)}
              style={styles.card}
            >
              <View style={styles.row}>
                <View style={styles.info}>
                  <ThemedText type="default" style={styles.title} numberOfLines={1}>
                    {recipe.title}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {recipe.ingredients.length} ingredientes · {recipe.steps.length} pasos
                    {recipe.groupIds.length > 0 ? ` · ${recipe.groupIds.length} grupo(s)` : ''}
                  </ThemedText>
                </View>
                <IconButton
                  icon={Icons.edit}
                  accessibilityLabel={`Editar ${recipe.title}`}
                  onPress={() => router.push(`/recipes/${recipe.id}/edit`)}
                />
                <IconButton
                  icon={Icons.delete}
                  accessibilityLabel={`Borrar ${recipe.title}`}
                  onPress={() => handleDelete(recipe)}
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
