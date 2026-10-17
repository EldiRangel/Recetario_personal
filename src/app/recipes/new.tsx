import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

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

export default function NewRecipeScreen() {
  const { user } = useApp();

  if (!user) return <Redirect href="/login" />;

  return <NewRecipeForm />;
}

function NewRecipeForm() {
  const { addRecipe, groups, user } = useApp();
  const router = useRouter();
  const theme = useTheme();
  // Solo se pueden asociar recetas a los grupos del propio usuario.
  const myGroups = groups.filter((g) => g.createdBy === user?.id);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [servings, setServings] = useState('');
  const [ingredients, setIngredients] = useState([{ id: 'ing-1', name: '', quantity: '' }]);
  const [steps, setSteps] = useState(['']);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
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

    const errorMessage = await addRecipe({
      title: title.trim(),
      description: description.trim(),
      ingredients: ing,
      steps: st,
      category: category.trim() || undefined,
      prepTime: prepTime.trim() || undefined,
      cookTime: cookTime.trim() || undefined,
      servings: servings.trim() ? Number(servings) : undefined,
      groupIds: selectedGroupIds,
      isPublic: true,
    });

    if (errorMessage) {
      setError(errorMessage);
      return;
    }

    // Regresar a la pantalla anterior
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/recipes');
    }
  };

  return (
    <Screen scroll>
      <ThemedText type="title" style={styles.pageTitle}>
        Nueva receta
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
        <SectionHeader icon={Icons.info} title="Información básica" />
        <Input
          label="Título de la receta"
          placeholder="Ej. Arroz con pollo"
          value={title}
          onChangeText={setTitle}
          maxLength={LIMITS.recipeTitle.max}
        />
        <Input
          label="Descripción"
          placeholder="Una breve descripción de la receta"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={styles.multiline}
          maxLength={LIMITS.recipeDescription.max}
        />
        <Input
          label="Categoría"
          placeholder="Ej. Principal, Postre, Entrada"
          value={category}
          onChangeText={setCategory}
          maxLength={LIMITS.category.max}
        />
        <View style={styles.timeRow}>
          <Input
            label="Preparación"
            placeholder="15 min"
            value={prepTime}
            onChangeText={setPrepTime}
            containerStyle={styles.timeInput}
            maxLength={LIMITS.timeText.max}
          />
          <Input
            label="Cocción"
            placeholder="30 min"
            value={cookTime}
            onChangeText={setCookTime}
            containerStyle={styles.timeInput}
            maxLength={LIMITS.timeText.max}
          />
          <Input
            label="Porciones"
            placeholder="4"
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
        <SectionHeader icon={Icons.groups} title="Grupos (opcional)" />
        {myGroups.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            No hay grupos aún. Crea uno desde la sección Grupos.
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
        <SectionHeader
          icon={Icons.ingredients}
          title={`Ingredientes (${ingredients.filter((i) => i.name.trim()).length})`}
        />
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

      <Button title="Guardar receta" icon={Icons.save} size="lg" fullWidth onPress={handleSave} />
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
});
