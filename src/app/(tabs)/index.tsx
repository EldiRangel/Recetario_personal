import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';

import { Button } from '@/components/Button';
import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Icon, Icons } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/hooks/use-theme';
import { Recipe } from '@/types';

function sortByTitle(list: Recipe[]) {
  return [...list].sort((a, b) => a.title.localeCompare(b.title));
}

export default function HomeScreen() {
  const { user, users, recipes, groups } = useApp();
  const router = useRouter();
  const theme = useTheme();
  const [tab, setTab] = useState<'personal' | 'general'>('personal');

  if (!user) {
    return <Redirect href="/login" />;
  }

  const myRecipes = sortByTitle(recipes.filter((r) => r.createdBy === user.id));
  const generalRecipes = sortByTitle(recipes.filter((r) => r.isPublic && r.createdBy !== user.id));
  const myGroups = groups.filter((g) => g.createdBy === user.id);
  const list = tab === 'personal' ? myRecipes : generalRecipes;

  const stats = [
    { key: 'recipes', icon: Icons.recipes, value: myRecipes.length, label: 'Mis recetas' },
    { key: 'groups', icon: Icons.groups, value: myGroups.length, label: 'Mis grupos' },
    { key: 'general', icon: Icons.people, value: generalRecipes.length, label: 'En general' },
  ];

  return (
    <Screen scroll edges={['top']}>
      {/* Saludo */}
      <View style={styles.header}>
        <ThemedText type="smallBold" style={[styles.brand, { color: theme.primary }]}>
          RECETARIO
        </ThemedText>
        <ThemedText type="title" style={styles.greeting}>
          Hola, {user.name.split(' ')[0]}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          ¿Qué vas a cocinar hoy?
        </ThemedText>
      </View>

      {/* Estadísticas del usuario */}
      <View style={styles.stats}>
        {stats.map((stat) => (
          <Card key={stat.key} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: theme.primarySoft }]}>
              <Icon name={stat.icon} size={16} color={theme.primary} />
            </View>
            <ThemedText type="default" style={styles.statValue}>
              {stat.value}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel} numberOfLines={1}>
              {stat.label}
            </ThemedText>
          </Card>
        ))}
      </View>

      {/* Selector de vista */}
      <View style={[styles.segment, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <SegmentButton
          label={`Mis recetas (${myRecipes.length})`}
          active={tab === 'personal'}
          onPress={() => setTab('personal')}
        />
        <SegmentButton
          label={`En general (${generalRecipes.length})`}
          active={tab === 'general'}
          onPress={() => setTab('general')}
        />
      </View>

      {/* Lista de recetas */}
      {list.length === 0 ? (
        <EmptyState
          icon={Icons.recipes}
          title={tab === 'personal' ? 'Aún no tienes recetas' : 'No hay recetas públicas'}
          description={
            tab === 'personal'
              ? 'Crea tu primera receta y aparecerá aquí, ordenada alfabéticamente.'
              : 'Cuando otros usuarios compartan recetas aparecerán en esta vista.'
          }
          action={
            tab === 'personal' ? (
              <Button title="Crear receta" icon={Icons.add} onPress={() => router.push('/recipes/new')} />
            ) : undefined
          }
        />
      ) : (
        <View style={styles.list}>
          {list.map((recipe) => (
            <Card
              key={recipe.id}
              onPress={() => router.push(`/recipes/${recipe.id}`)}
              style={styles.recipeCard}
            >
              <View style={styles.recipeRow}>
                <View style={[styles.recipeIcon, { backgroundColor: theme.backgroundElement }]}>
                  <Icon name={Icons.recipes} size={18} color={theme.textSecondary} />
                </View>
                <View style={styles.recipeInfo}>
                  <ThemedText type="default" style={styles.recipeTitle} numberOfLines={1}>
                    {recipe.title}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    {recipe.ingredients.length} ingredientes · {recipe.steps.length} pasos
                    {tab === 'general'
                      ? ` · por ${users.find((u) => u.id === recipe.createdBy)?.name ?? 'otro usuario'}`
                      : recipe.groupIds.length > 0
                        ? ` · ${recipe.groupIds.length} grupo(s)`
                        : ''}
                  </ThemedText>
                </View>
                <Icon name={Icons.chevronRight} size={18} color={theme.textSecondary} />
              </View>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

function SegmentButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: theme.backgroundSelected }}
      style={[styles.segmentButton, active && [styles.segmentButtonActive, { backgroundColor: theme.card }]]}
    >
      <ThemedText
        type="smallBold"
        style={[styles.segmentLabel, { color: active ? theme.text : theme.textSecondary }]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: Spacing.four,
    marginBottom: Spacing.four,
    gap: Spacing.half,
  },
  brand: {
    fontSize: 11,
    letterSpacing: 1.5,
  },
  greeting: {
    fontSize: 30,
    lineHeight: 36,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.four,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.half,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  segment: {
    flexDirection: 'row',
    padding: Spacing.half + 2,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.four,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  segmentButtonActive: {
    boxShadow: '0 1px 3px rgba(16, 24, 40, 0.12)',
  },
  segmentLabel: {
    fontSize: 13,
  },
  list: {
    gap: Spacing.two,
  },
  recipeCard: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  recipeIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeInfo: {
    flex: 1,
    gap: Spacing.half,
  },
  recipeTitle: {
    fontWeight: '600',
  },
});
