import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { Group, Recipe, User } from '@/types';

interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  recipes: Recipe[];
  groups: Group[];
  users: User[];

  // Auth
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string) => boolean;
  logout: () => void;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'email' | 'avatar'>> & { password?: string }) => void;
  deleteAccount: () => void;

  // Recipes
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => boolean;
  updateRecipe: (id: string, updates: Partial<Recipe>) => boolean;
  deleteRecipe: (id: string) => boolean;

  // Groups
  addGroup: (group: Omit<Group, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => boolean;
  updateGroup: (id: string, updates: Partial<Group>) => boolean;
  deleteGroup: (id: string) => boolean;

  // Recipe <-> Group 
  addRecipeToGroup: (recipeId: string, groupId: string) => void;
  removeRecipeFromGroup: (recipeId: string, groupId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const now = () => new Date().toISOString();

// Clave bajo 
const STORAGE_KEY = 'recetario:data:v1';

type PersistedData = {
  users: User[];
  recipes: Recipe[];
  groups: Group[];
  userId: string | null;
};

const seedUser: User = {
  id: 'user_1',
  name: 'Usuario Demo',
  email: 'demo@recetario.com',
  password: '123456',
  createdAt: now(),
};

const seedRecipes: Recipe[] = [
  {
    id: 'recipe_1',
    title: 'Arroz con Pollo',
    description: 'Un clásico delicioso y sencillo.',
    ingredients: [
      { id: 'i1', name: 'Arroz', quantity: '2 tazas' },
      { id: 'i2', name: 'Pollo', quantity: '500 g' },
      { id: 'i3', name: 'Cebolla', quantity: '1 unidad' },
    ],
    steps: ['Dorar el pollo.', 'Agregar cebolla y arroz.', 'Cocer con agua hasta que esté listo.'],
    category: 'Principal',
    prepTime: '15 min',
    cookTime: '30 min',
    servings: 4,
    groupIds: [],
    isPublic: true,
    createdBy: seedUser.id,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'recipe_2',
    title: 'Ensalada César',
    description: 'Ensalada fresca con crutones y parmesano.',
    ingredients: [
      { id: 'i4', name: 'Lechuga romana', quantity: '1 unidad' },
      { id: 'i5', name: 'Parmesano', quantity: '50 g' },
      { id: 'i6', name: 'Crutones', quantity: '1/2 taza' },
    ],
    steps: ['Lavar y trocear la lechuga.', 'Agregar crutones y parmesano.', 'Aliñar al gusto.'],
    category: 'Entrada',
    prepTime: '10 min',
    cookTime: '0 min',
    servings: 2,
    groupIds: [],
    isPublic: true,
    createdBy: seedUser.id,
    createdAt: now(),
    updatedAt: now(),
  },
];

const seedGroups: Group[] = [
  {
    id: 'group_1',
    name: 'Cenas Rápidas',
    description: 'Recetas para preparar en poco tiempo.',
    recipeIds: [],
    createdBy: seedUser.id,
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: 'group_2',
    name: 'Favoritos',
    description: 'Las recetas más deliciosas.',
    recipeIds: [],
    createdBy: seedUser.id,
    createdAt: now(),
    updatedAt: now(),
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>(() => [seedUser]);
  const [user, setUser] = useState<User | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>(() => [...seedRecipes]);
  const [groups, setGroups] = useState<Group[]>(() => [...seedGroups]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && raw) {
          const data = JSON.parse(raw) as Partial<PersistedData>;
          const storedUsers = Array.isArray(data.users) ? data.users : [];
          if (storedUsers.length > 0) setUsers(storedUsers);
          if (Array.isArray(data.recipes)) setRecipes(data.recipes);
          if (Array.isArray(data.groups)) setGroups(data.groups);
          if (typeof data.userId === 'string') {
            const found = storedUsers.find((u) => u.id === data.userId);
            if (found) setUser(found);
          }
        }
      } catch {
       
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const data: PersistedData = { users, recipes, groups, userId: user?.id ?? null };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch(() => {
      
    });
  }, [hydrated, users, recipes, groups, user]);

  const login = useCallback(
    (email: string, password: string): boolean => {
      const normalized = email.trim().toLowerCase();
      const found = users.find((u) => u.email === normalized && u.password === password);
      if (!found) return false;
      setUser(found);
      return true;
    },
    [users]
  );

  const register = useCallback(
    (name: string, email: string, password: string): boolean => {
      if (!name.trim() || !email.trim() || !password) return false;
      const normalized = email.trim().toLowerCase();
      // El correo debe ser único: si ya está registrado no se permite otra cuenta.
      if (users.some((u) => u.email === normalized)) return false;
      const newUser: User = {
        id: generateId(),
        name: name.trim(),
        email: normalized,
        password,
        createdAt: now(),
      };
      setUsers((prev) => [...prev, newUser]);
      setUser(newUser);
      return true;
    },
    [users]
  );

  const logout = useCallback(() => {
    // Solo se cierra la sesión: los datos permanecen disponibles para el
    // siguiente inicio de sesión.
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    (updates: Partial<Pick<User, 'name' | 'email' | 'avatar'>> & { password?: string }) => {
      if (!user) return;
      const next: User = {
        ...user,
        ...updates,
        email: updates.email ? updates.email.trim().toLowerCase() : user.email,
      };
      setUser(next);
      // Mantener sincronizado el registro de usuarios para futuros inicios de sesión.
      setUsers((prev) => prev.map((u) => (u.id === user.id ? next : u)));
    },
    [user]
  );

  const deleteAccount = useCallback(() => {
    if (!user) return;
    const uid = user.id;
    const myGroupIds = new Set(groups.filter((g) => g.createdBy === uid).map((g) => g.id));
    const myRecipeIds = new Set(recipes.filter((r) => r.createdBy === uid).map((r) => r.id));

    // 1. Eliminar las recetas propias y desvincular las ajenas de sus grupos.
    setRecipes((prev) => {
      const next: Recipe[] = [];
      for (const r of prev) {
        if (r.createdBy === uid) continue;
        const remaining = r.groupIds.filter((gid) => !myGroupIds.has(gid));
        next.push(
          remaining.length === r.groupIds.length ? r : { ...r, groupIds: remaining, updatedAt: now() }
        );
      }
      return next;
    });

    // 2. Eliminar los grupos propios y quitarlos de las recetas ajenas.
    setGroups((prev) =>
      prev
        .filter((g) => g.createdBy !== uid)
        .map((g) => {
          const remaining = g.recipeIds.filter((rid) => !myRecipeIds.has(rid));
          return remaining.length === g.recipeIds.length
            ? g
            : { ...g, recipeIds: remaining, updatedAt: now() };
        })
    );

    // 3. Eliminar la cuenta del registro y cerrar la sesión.
    setUsers((prev) => prev.filter((u) => u.id !== uid));
    setUser(null);
  }, [user, groups, recipes]);

  // ---------- Recetas ----------
  const addRecipe = useCallback(
    (recipe: Omit<Recipe, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>): boolean => {
      if (!user) return false;

      const newTitle = recipe.title.toLowerCase().trim();
      // No se permite duplicar el título para las recetas del mismo usuario.
      const exists = recipes.some(
        (r) => r.createdBy === user.id && r.title.toLowerCase().trim() === newTitle
      );
      if (exists) return false;

      const newRecipe: Recipe = {
        ...recipe,
        id: generateId(),
        title: recipe.title.trim(),
        createdBy: user.id,
        createdAt: now(),
        updatedAt: now(),
        groupIds: recipe.groupIds ?? [],
      };

      setRecipes((prev) => [...prev, newRecipe]);

      // Sincronizar la relación con los grupos seleccionados.
      setGroups((prevGroups) =>
        prevGroups.map((g) =>
          newRecipe.groupIds.includes(g.id) && !g.recipeIds.includes(newRecipe.id)
            ? { ...g, recipeIds: [...g.recipeIds, newRecipe.id], updatedAt: now() }
            : g
        )
      );

      return true;
    },
    [user, recipes]
  );

  const updateRecipe = useCallback(
    (id: string, updates: Partial<Recipe>): boolean => {
      if (!user) return false;

      const target = recipes.find((r) => r.id === id && r.createdBy === user.id);
      if (!target) return false;

      // Validar duplicado de título si se cambia.
      if (updates.title) {
        const newTitle = updates.title.toLowerCase().trim();
        const dup = recipes.some(
          (other) => other.id !== id && other.createdBy === user.id && other.title.toLowerCase().trim() === newTitle
        );
        if (dup) return false;
      }

      setRecipes((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                ...updates,
                title: updates.title ? updates.title.trim() : r.title,
                updatedAt: now(),
              }
            : r
        )
      );
      return true;
    },
    [user, recipes]
  );

  const deleteRecipe = useCallback(
    (id: string): boolean => {
      if (!user) return false;

      const target = recipes.find((r) => r.id === id && r.createdBy === user.id);
      if (!target) return false;

      setRecipes((prev) => prev.filter((r) => r.id !== id));

      // Desvincular de todos los grupos (la receta deja de existir en ellos).
      setGroups((prev) =>
        prev.map((g) => ({
          ...g,
          recipeIds: g.recipeIds.filter((rid) => rid !== id),
          updatedAt: now(),
        }))
      );

      return true;
    },
    [user, recipes]
  );

  // ---------- Grupos ----------
  const addGroup = useCallback(
    (group: Omit<Group, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>): boolean => {
      if (!user) return false;

      const newName = group.name.toLowerCase().trim();
      const exists = groups.some(
        (g) => g.createdBy === user.id && g.name.toLowerCase().trim() === newName
      );
      if (exists) return false;

      const newGroup: Group = {
        ...group,
        id: generateId(),
        name: group.name.trim(),
        createdBy: user.id,
        createdAt: now(),
        updatedAt: now(),
        recipeIds: group.recipeIds ?? [],
      };

      setGroups((prev) => [...prev, newGroup]);
      return true;
    },
    [user, groups]
  );

  const updateGroup = useCallback(
    (id: string, updates: Partial<Group>): boolean => {
      if (!user) return false;

      const target = groups.find((g) => g.id === id && g.createdBy === user.id);
      if (!target) return false;

      if (updates.name) {
        const newName = updates.name.toLowerCase().trim();
        const dup = groups.some(
          (other) => other.id !== id && other.createdBy === user.id && other.name.toLowerCase().trim() === newName
        );
        if (dup) return false;
      }

      setGroups((prev) =>
        prev.map((g) =>
          g.id === id
            ? {
                ...g,
                ...updates,
                name: updates.name ? updates.name.trim() : g.name,
                updatedAt: now(),
              }
            : g
        )
      );
      return true;
    },
    [user, groups]
  );

  const deleteGroup = useCallback(
    (id: string): boolean => {
      if (!user) return false;

      const target = groups.find((g) => g.id === id && g.createdBy === user.id);
      if (!target) return false;

      // 1. Quitar el grupo.
      setGroups((prev) => prev.filter((g) => g.id !== id));

      // 2. Reglas para las recetas del grupo:
      //    - Si la receta también está en otros grupos, solo se desvincula de este.
      //    - Si la receta pertenecía únicamente a este grupo, se elimina.
      setRecipes((prev) => {
        const next: Recipe[] = [];
        for (const r of prev) {
          if (!r.groupIds.includes(id)) {
            next.push(r);
            continue;
          }
          const otherGroups = r.groupIds.filter((gid) => gid !== id);
          if (otherGroups.length === 0 && r.createdBy === user.id) {
            // Receta exclusiva del grupo borrado -> se elimina.
            continue;
          }
          next.push({ ...r, groupIds: otherGroups, updatedAt: now() });
        }
        return next;
      });

      return true;
    },
    [user, groups]
  );

  // ---------- Asociaciones receta <-> grupo ----------
  const addRecipeToGroup = useCallback((recipeId: string, groupId: string) => {
    setRecipes((prev) =>
      prev.map((r) =>
        r.id === recipeId && !r.groupIds.includes(groupId)
          ? { ...r, groupIds: [...r.groupIds, groupId], updatedAt: now() }
          : r
      )
    );
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId && !g.recipeIds.includes(recipeId)
          ? { ...g, recipeIds: [...g.recipeIds, recipeId], updatedAt: now() }
          : g
      )
    );
  }, []);

  const removeRecipeFromGroup = useCallback((recipeId: string, groupId: string) => {
    setRecipes((prev) =>
      prev.map((r) =>
        r.id === recipeId
          ? { ...r, groupIds: r.groupIds.filter((gid) => gid !== groupId), updatedAt: now() }
          : r
      )
    );
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, recipeIds: g.recipeIds.filter((rid) => rid !== recipeId), updatedAt: now() }
          : g
      )
    );
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      hydrated,
      recipes,
      groups,
      users,
      login,
      register,
      logout,
      updateProfile,
      deleteAccount,
      addRecipe,
      updateRecipe,
      deleteRecipe,
      addGroup,
      updateGroup,
      deleteGroup,
      addRecipeToGroup,
      removeRecipeFromGroup,
    }),
    [
      user,
      hydrated,
      recipes,
      groups,
      users,
      login,
      register,
      logout,
      updateProfile,
      deleteAccount,
      addRecipe,
      updateRecipe,
      deleteRecipe,
      addGroup,
      updateGroup,
      deleteGroup,
      addRecipeToGroup,
      removeRecipeFromGroup,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}
