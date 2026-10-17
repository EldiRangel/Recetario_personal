import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Icon, Icons } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { Radius, Spacing } from '@/constants/theme';
import { LIMITS } from '@/constants/validation';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/hooks/use-theme';
import { Recipe } from '@/types';

export default function RecipeEditScreen() {
  const { user, recipes } = useApp();
  const params = useLocalSearchParams<{ id: string }>();

  if (!user) return <Redirect href="/login" />;

  const recipe = recipes.find((r) => r.id === params.id && r.createdBy === user.id);
  if (!recipe) {
    return (
      <Screen scroll>
        <ThemedText type="title" style={styles.notFound}>
          Receta no encontrada
        </ThemedText>
      </Screen>
    );
  }

  return <RecipeEditForm recipe={recipe} />;
}

function RecipeEditForm({ recipe }: { recipe: Recipe }) {
  const { updateRecipe, groups, addRecipeToGroup, removeRecipeFromGroup, deleteRecipe, user } = useApp();
  const router = useRouter();
  const theme = useTheme();
  // Solo se pueden asociar recetas a los grupos del propio usuario.
  const myGroups = groups.filter((g) => g.createdBy === user?.id);
  const [title, setTitle] = useState(recipe.title);
  const [description, setDescription] = useState(recipe.description);
  const [category, setCategory] = useState(recipe.category ?? '');
  const [prepTime, setPrepTime] = useState(recipe.prepTime ?? '');
  const [cookTime, setCookTime] = useState(recipe.cookTime ?? '');
  const [servings, setServings] = useState(recipe.servings ? String(recipe.servings) : '');
  const [ingredients, setIngredients] = useState([...recipe.ingredients]);
  const [steps, setSteps] = useState([...recipe.steps]);
  const [selectedGroupIds, setSelectedGroupIds] = useState([...recipe.groupIds]);
  const [error, setError] = useState('');

  const addIngredient = () =>
    setIngredients((prev) => [...prev, { id: `ing-${Date.now()}`, name: '', quantity: '' }]);
  const removeIngredient = (index: number) =>
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  const addStep = () => setSteps((prev) => [...prev, '']);
  const removeStep = (index: number) => setSteps((prev) => prev.filter((_, i) => i !== index));

  const toggleGroup = (id: string) => {
    setSelectedGroupIds((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  };

  const handleSave = async () => {
    setError('');
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('El título es obligatorio.');
      return;
    }
    if (trimmedTitle.length < LIMITS.recipeTitle.min || trimmedTitle.length > LIMITS.recipeTitle.max) {
      setError(`El título debe tener entre ${LIMITS.recipeTitle.min} y ${LIMITS.recipeTitle.max} caracteres.`);
      return;
    }
    if (servings.trim() && !/^[1-9]\d?$/.test(servings.trim())) {
      setError('Las porciones deben ser un número entre 1 y 99.');
      return;
    }

    const ing = ingredients
      .filter((i) => i.name.trim())
      .map((i) => ({ id: String(Date.now() + Math.random()), name: i.name.trim(), quantity: i.quantity.trim() }));
    const st = steps.filter((s) => s.trim());

    const errorMessage = await updateRecipe(recipe.id, {
      title: title.trim(),
      description: description.trim(),
      category: category.trim() || undefined,
      prepTime: prepTime.trim() || undefined,
      cookTime: cookTime.trim() || undefined,
      servings: servings.trim() ? Number(servings) : undefined,
      ingredients: ing,
      steps: st,
    });

    if (errorMessage) {
      setError(errorMessage);
      return;
    }

    // Sincronizar la relación muchos-a-muchos con los grupos seleccionados.
    const current = new Set(recipe.groupIds);
    const next = new Set(selectedGroupIds);
    for (const gid of next) {
      if (!current.has(gid)) await addRecipeToGroup(recipe.id, gid);
    }
    for (const gid of current) {
      if (!next.has(gid)) await removeRecipeFromGroup(recipe.id, gid);
    }

    router.dismissTo(`/recipes/${recipe.id}`);
  };

  const handleDelete = () => {
    Alert.alert('Borrar receta', `¿Deseas eliminar "${recipe.title}"? Se desvinculará de todos los grupos.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          void deleteRecipe(recipe.id).then(() => router.dismissAll());
        },
      },
    ]);
  };

  return (
    <Screen scroll>
      <ThemedText type="title" style={styles.pageTitle}>
        Editar receta
      </ThemedText>

      {error !== '' && (
        <View style={[styles.errorBox, { backgroundColor: theme.dangerSoft }]}>
          <Icon name={Icons.warning} size={16} color={theme.danger} />
          <ThemedText type="small" style={[styles.errorText, { color: theme.danger }]}>
            {error}
          </ThemedText>
        </View>
      )}

      {/* Información básica */}
      <Card style={styles.card}>
        <SectionHeader icon={Icons.info} title="Información básica" />
        <Input label="Título de la receta" value={title} onChangeText={setTitle} maxLength={LIMITS.recipeTitle.max} />
        <Input
          label="Descripción"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={styles.multiline}
          maxLength={LIMITS.recipeDescription.max}
        />
        <Input label="Categoría" value={category} onChangeText={setCategory} maxLength={LIMITS.category.max} />
        <View style={styles.timeRow}>
          <Input
            label="Preparación"
            value={prepTime}
            onChangeText={setPrepTime}
            containerStyle={styles.timeInput}
            maxLength={LIMITS.timeText.max}
          />
          <Input
            label="Cocción"
            value={cookTime}
            onChangeText={setCookTime}
            containerStyle={styles.timeInput}
            maxLength={LIMITS.timeText.max}
          />
          <Input
            label="Porciones"
            keyboardType="number-pad"
            value={servings}
            onChangeText={setServings}
            containerStyle={styles.timeInput}
            maxLength={2}
          />
        </View>
      </Card>

      {/* Grupos */}
      <Card style={styles.card}>
        <SectionHeader icon={Icons.groups} title={`Grupos (${selectedGroupIds.length})`} />
        {myGroups.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            No hay grupos disponibles. Crea uno desde la sección Grupos.
          </ThemedText>
        ) : (
          <View style={styles.chips}>
            {myGroups.map((g) => (
              <Chip key={g.id} label={g.name} selected={selectedGroupIds.includes(g.id)} onPress={() => toggleGroup(g.id)} />
            ))}
          </View>
        )}
      </Card>

      {/* Ingredientes */}
      <Card style={styles.card}>
        <SectionHeader icon={Icons.ingredients} title={`Ingredientes (${ingredients.filter((i) => i.name.trim()).length})`} />
        {ingredients.map((ing, index) => (
          <View key={ing.id} style={styles.row}>
            <Input
              placeholder="Ingrediente"
              value={ing.name}
              containerStyle={styles.flexName}
              onChangeText={(t) => {
                setIngredients((prev) => prev.map((x, i) => (i === index ? { ...x, name: t } : x)));
              }}
              maxLength={LIMITS.ingredientName.max}
            />
            <Input
              placeholder="Cantidad"
              value={ing.quantity}
              containerStyle={styles.flexQty}
              onChangeText={(t) => {
                setIngredients((prev) => prev.map((x, i) => (i === index ? { ...x, quantity: t } : x)));
              }}
              maxLength={LIMITS.ingredientQuantity.max}
            />
            <IconButton
              icon={Icons.close}
              accessibilityLabel={`Quitar ingrediente ${index + 1}`}
              onPress={() => removeIngredient(index)}
            />
          </View>
        ))}
        <Button title="Agregar ingrediente" icon={Icons.add} variant="ghost" onPress={addIngredient} />
      </Card>

      {/* Pasos */}
      <Card style={styles.card}>
        <SectionHeader icon={Icons.steps} title={`Pasos (${steps.filter((s) => s.trim()).length})`} />
        {steps.map((step, index) => (
          <View key={index} style={styles.row}>
            <View style={[styles.stepBadge, { backgroundColor: theme.primarySoft }]}>
              <ThemedText type="smallBold" style={{ color: theme.primary }}>
                {index + 1}
              </ThemedText>
            </View>
            <Input
              placeholder="Describe el paso..."
              value={step}
              containerStyle={styles.flexName}
              multiline
              onChangeText={(t) => {
                setSteps((prev) => prev.map((s, i) => (i === index ? t : s)));
              }}
              maxLength={LIMITS.step.max}
            />
            <IconButton
              icon={Icons.close}
              accessibilityLabel={`Quitar paso ${index + 1}`}
              onPress={() => removeStep(index)}
            />
          </View>
        ))}
        <Button title="Agregar paso" icon={Icons.add} variant="ghost" onPress={addStep} />
      </Card>

      <View style={styles.actions}>
        <Button title="Guardar cambios" icon={Icons.save} size="lg" fullWidth onPress={handleSave} style={styles.actionButton} />
        <Button title="Eliminar" icon={Icons.delete} variant="danger" size="lg" onPress={handleDelete} />
      </View>
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
  timeRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  timeInput: {
    flex: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  flexName: {
    flex: 1.6,
  },
  flexQty: {
    flex: 1,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
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
