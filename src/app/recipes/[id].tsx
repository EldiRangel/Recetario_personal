import { Alert, StyleSheet, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Icon, Icons, type IconName } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/hooks/use-theme';

export default function RecipeDetailScreen() {
  const { user, users, recipes, groups, removeRecipeFromGroup, deleteRecipe } = useApp();
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ id: string }>();

  if (!user) return <Redirect href="/login" />;

  // Se puede ver la receta propia o cualquier receta pública (vista "En general").
  const recipe = recipes.find((r) => r.id === params.id && (r.createdBy === user.id || r.isPublic));

  if (!recipe) {
    return (
      <Screen scroll>
        <ThemedText type="title" style={styles.notFound}>
          Receta no encontrada
        </ThemedText>
      </Screen>
    );
  }

  const recipeGroups = groups.filter((g) => recipe.groupIds.includes(g.id));

  // Autor y permisos: solo el creador puede editar, borrar o quitar de grupos.
  const isOwner = recipe.createdBy === user.id;
  const authorName = users.find((u) => u.id === recipe.createdBy)?.name;

  // Metadatos a mostrar como chips informativos.
  const metaChips: { icon: IconName; label: string }[] = [];
  if (recipe.category) metaChips.push({ icon: Icons.bookmark, label: recipe.category });
  if (recipe.prepTime) metaChips.push({ icon: Icons.time, label: `Prep: ${recipe.prepTime}` });
  if (recipe.cookTime) metaChips.push({ icon: Icons.time, label: `Cocción: ${recipe.cookTime}` });
  if (recipe.servings) metaChips.push({ icon: Icons.people, label: `${recipe.servings} porciones` });

  const handleDelete = () => {
    Alert.alert('Borrar receta', `¿Deseas eliminar "${recipe.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          void deleteRecipe(recipe.id).then(() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/recipes');
            }
          });
        },
      },
    ]);
  };

  const handleRemoveFromGroup = (groupId: string, groupName: string) => {
    Alert.alert('Quitar del grupo', `¿Quitar "${recipe.title}" del grupo "${groupName}"? La receta no se borrará.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', onPress: () => void removeRecipeFromGroup(recipe.id, groupId) },
    ]);
  };

  return (
    <Screen scroll>
      {/* Encabezado */}
      <Card style={styles.headerCard}>
        <ThemedText type="title" style={styles.title}>
          {recipe.title}
        </ThemedText>
        {metaChips.length > 0 && (
          <View style={styles.metaRow}>
            {metaChips.map((chip, index) => (
              <View key={index} style={[styles.metaChip, { backgroundColor: theme.backgroundElement }]}>
                <Icon name={chip.icon} size={13} />
                <ThemedText type="small" themeColor="textSecondary" style={styles.metaText}>
                  {chip.label}
                </ThemedText>
              </View>
            ))}
          </View>
        )}
        {recipe.description !== '' && (
          <ThemedText type="default" style={styles.description}>
            {recipe.description}
          </ThemedText>
        )}
        {!isOwner && (
          <View style={[styles.ownerHint, { backgroundColor: theme.backgroundElement }]}>
            <Icon name={Icons.info} size={15} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.ownerHintText}>
              {authorName ? `Receta de ${authorName}. ` : ''}Solo lectura: no puedes editarla ni borrarla.
            </ThemedText>
          </View>
        )}
      </Card>

      {/* Ingredientes */}
      <Card style={styles.section}>
        <SectionHeader icon={Icons.ingredients} title={`Ingredientes (${recipe.ingredients.length})`} />
        {recipe.ingredients.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            No se registraron ingredientes.
          </ThemedText>
        ) : (
          <View>
            {recipe.ingredients.map((ing, index) => (
              <View
                key={ing.id}
                style={[
                  styles.ingredientRow,
                  index < recipe.ingredients.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
                ]}
              >
                <ThemedText type="default" style={styles.ingredientName}>
                  {ing.name}
                </ThemedText>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {ing.quantity}
                </ThemedText>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* Pasos */}
      <Card style={styles.section}>
        <SectionHeader icon={Icons.steps} title={`Pasos (${recipe.steps.length})`} />
        {recipe.steps.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            No se registraron pasos.
          </ThemedText>
        ) : (
          recipe.steps.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: theme.primarySoft }]}>
                <ThemedText type="smallBold" style={{ color: theme.primary }}>
                  {index + 1}
                </ThemedText>
              </View>
              <ThemedText type="default" style={styles.stepText}>
                {step}
              </ThemedText>
            </View>
          ))
        )}
      </Card>

      {/* Grupos */}
      <Card style={styles.section}>
        <SectionHeader icon={Icons.groups} title={`Grupos (${recipeGroups.length})`} />
        {recipeGroups.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            Esta receta no pertenece a ningún grupo.
          </ThemedText>
        ) : (
          recipeGroups.map((g) => (
            <View key={g.id} style={[styles.groupRow, { backgroundColor: theme.backgroundElement }]}>
              <Icon name={Icons.groups} size={16} />
              <ThemedText type="default" style={styles.groupName} numberOfLines={1}>
                {g.name}
              </ThemedText>
              {isOwner && (
                <IconButton
                  icon={Icons.close}
                  size={16}
                  accessibilityLabel={`Quitar del grupo ${g.name}`}
                  onPress={() => handleRemoveFromGroup(g.id, g.name)}
                />
              )}
            </View>
          ))
        )}
      </Card>

      {/* Acciones (solo para el autor de la receta) */}
      {isOwner && (
        <View style={styles.actions}>
          <Button
            title="Editar"
            icon={Icons.edit}
            fullWidth
            onPress={() => router.push(`/recipes/${recipe.id}/edit`)}
            style={styles.actionButton}
          />
          <Button
            title="Borrar"
            icon={Icons.delete}
            variant="danger"
            fullWidth
            onPress={handleDelete}
            style={styles.actionButton}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    gap: Spacing.two,
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two + Spacing.half,
    paddingVertical: Spacing.one + Spacing.half,
    borderRadius: Radius.full,
  },
  metaText: {
    fontSize: 12,
  },
  description: {
    marginTop: Spacing.one,
  },
  ownerHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    marginTop: Spacing.one,
  },
  ownerHintText: {
    flex: 1,
  },
  section: {
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  ingredientName: {
    flex: 1,
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.half,
  },
  stepText: {
    flex: 1,
    lineHeight: 24,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.one,
    paddingVertical: Spacing.one,
    borderRadius: Radius.md,
  },
  groupName: {
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
