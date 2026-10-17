import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import * as api from '@/services/api';
import { TOKEN_STORAGE_KEY } from '@/services/api';
import { Group, Recipe, User } from '@/types';

/**
 * Estado global de la app. Todos los datos (usuarios, recetas y grupos) viven
 * en el backend de la nube; aquí solo se guarda el token de sesión en el
 * dispositivo.
 *
 * Las funciones devuelven `null` cuando todo va bien o un mensaje de error
 * listo para mostrar en pantalla.
 */
interface AppContextType {
  user: User | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  recipes: Recipe[];
  groups: Group[];
  users: User[];

  // Auth
  login: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => void;
  updateProfile: (
    updates: Partial<Pick<User, 'name' | 'email' | 'avatar'>> & { password?: string }
  ) => Promise<string | null>;
  deleteAccount: () => Promise<void>;

  // Recipes
  addRecipe: (
    recipe: Omit<Recipe, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>
  ) => Promise<string | null>;
  updateRecipe: (id: string, updates: Partial<Recipe>) => Promise<string | null>;
  deleteRecipe: (id: string) => Promise<string | null>;

  // Groups
  addGroup: (group: Omit<Group, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  updateGroup: (id: string, updates: Partial<Group>) => Promise<string | null>;
  deleteGroup: (id: string) => Promise<string | null>;

  // Recipe <-> Group
  addRecipeToGroup: (recipeId: string, groupId: string) => Promise<void>;
  removeRecipeFromGroup: (recipeId: string, groupId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/** Traduce los errores del cliente HTTP a un mensaje o null si todo salió bien. */
function toErrorMessage(err: unknown): string {
  if (err instanceof api.ApiError) return err.message;
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Carga los datos del servidor tras restaurar la sesión.
  const loadData = useCallback(async () => {
    const [usersRes, recipesRes, groupsRes] = await Promise.all([
      api.listUsers(),
      api.listRecipes(),
      api.listGroups(),
    ]);
    setUsers(usersRes.users);
    setRecipes(recipesRes.recipes);
    setGroups(groupsRes.groups);
  }, []);

  // Restaura la sesión guardada y descarga los datos iniciales.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        if (token) {
          api.setAuthToken(token);
          const { user: me } = await api.me();
          if (cancelled) return;
          setUser(me);
          await loadData();
        }
      } catch {
        // Token vencido o sin conexión: se limpia la sesión local.
        await api.clearStoredToken();
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  // ---------- Auth ----------
  const login = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      try {
        const { token, user: logged } = await api.login(email.trim().toLowerCase(), password);
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
        api.setAuthToken(token);
        setUser(logged);
        await loadData();
        return null;
      } catch (err) {
        return toErrorMessage(err);
      }
    },
    [loadData]
  );

  const register = useCallback(
    async (name: string, email: string, password: string): Promise<string | null> => {
      try {
        const { token, user: created } = await api.register(
          name.trim(),
          email.trim().toLowerCase(),
          password
        );
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
        api.setAuthToken(token);
        setUser(created);
        await loadData();
        return null;
      } catch (err) {
        return toErrorMessage(err);
      }
    },
    [loadData]
  );

  const logout = useCallback(() => {
    // Solo se cierra la sesión en el dispositivo; los datos siguen en la nube.
    void api.clearStoredToken();
    setUser(null);
    setUsers([]);
    setRecipes([]);
    setGroups([]);
  }, []);

  const updateProfile = useCallback(
    async (
      updates: Partial<Pick<User, 'name' | 'email' | 'avatar'>> & { password?: string }
    ): Promise<string | null> => {
      if (!user) return 'Debes iniciar sesión.';

      try {
        let updated = user;

        // El avatar puede ser una imagen local (subirla), un data URL (web)
        // o undefined para eliminarlo.
        if ('avatar' in updates) {
          const avatar = updates.avatar;
          if (!avatar) {
            updated = (await api.setAvatar(null)).user;
          } else if (avatar.startsWith('data:')) {
            updated = (await api.setAvatar(avatar)).user;
          } else {
            updated = await api.uploadAvatar(avatar);
          }
        }

        const { avatar: _avatar, ...rest } = updates;
        if (rest.name !== undefined || rest.email !== undefined || rest.password !== undefined) {
          updated = (await api.updateProfile(rest)).user;
        }

        setUser(updated);
        return null;
      } catch (err) {
        return toErrorMessage(err);
      }
    },
    [user]
  );

  const deleteAccount = useCallback(async (): Promise<void> => {
    if (!user) return;
    try {
      await api.deleteAccount();
    } catch {
      // Aunque falle la petición se cierra sesión en el dispositivo.
    }
    logout();
  }, [user, logout]);

  // ---------- Recetas ----------
  const addRecipe = useCallback(
    async (recipe: Omit<Recipe, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
      if (!user) return 'Debes iniciar sesión.';

      try {
        const { recipe: created } = await api.createRecipe({
          title: recipe.title,
          description: recipe.description,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          category: recipe.category,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          servings: recipe.servings,
          image: recipe.image,
          isPublic: recipe.isPublic,
          groupIds: recipe.groupIds ?? [],
        });
        setRecipes((prev) => [...prev, created]);
        // Sincronizar la relación con los grupos seleccionados.
        setGroups((prev) =>
          prev.map((g) =>
            created.groupIds.includes(g.id) && !g.recipeIds.includes(created.id)
              ? { ...g, recipeIds: [...g.recipeIds, created.id] }
              : g
          )
        );
        return null;
      } catch (err) {
        return toErrorMessage(err);
      }
    },
    [user]
  );

  const updateRecipe = useCallback(
    async (id: string, updates: Partial<Recipe>): Promise<string | null> => {
      if (!user) return 'Debes iniciar sesión.';

      try {
        const { recipe: updated } = await api.updateRecipe(id, updates);
        setRecipes((prev) => prev.map((r) => (r.id === id ? updated : r)));
        return null;
      } catch (err) {
        return toErrorMessage(err);
      }
    },
    [user]
  );

  const deleteRecipe = useCallback(
    async (id: string): Promise<string | null> => {
      if (!user) return 'Debes iniciar sesión.';

      try {
        await api.deleteRecipe(id);
        setRecipes((prev) => prev.filter((r) => r.id !== id));
        // Desvincular de todos los grupos (la receta deja de existir en ellos).
        setGroups((prev) =>
          prev.map((g) => ({
            ...g,
            recipeIds: g.recipeIds.filter((rid) => rid !== id),
          }))
        );
        return null;
      } catch (err) {
        return toErrorMessage(err);
      }
    },
    [user]
  );

  // ---------- Grupos ----------
  const addGroup = useCallback(
    async (group: Omit<Group, 'id' | 'createdBy' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
      if (!user) return 'Debes iniciar sesión.';

      try {
        const { group: created } = await api.createGroup({
          name: group.name,
          description: group.description,
        });
        setGroups((prev) => [...prev, created]);
        return null;
      } catch (err) {
        return toErrorMessage(err);
      }
    },
    [user]
  );

  const updateGroup = useCallback(
    async (id: string, updates: Partial<Group>): Promise<string | null> => {
      if (!user) return 'Debes iniciar sesión.';

      try {
        const { group: updated } = await api.updateGroup(id, {
          name: updates.name,
          description: updates.description,
        });
        setGroups((prev) => prev.map((g) => (g.id === id ? updated : g)));
        return null;
      } catch (err) {
        return toErrorMessage(err);
      }
    },
    [user]
  );

  const deleteGroup = useCallback(
    async (id: string): Promise<string | null> => {
      if (!user) return 'Debes iniciar sesión.';

      try {
        await api.deleteGroup(id);
        const deletedRecipeIds = groups.find((g) => g.id === id)?.recipeIds ?? [];
        setGroups((prev) => prev.filter((g) => g.id !== id));
        // El servidor borra las recetas exclusivas del grupo y desvincula las
        // demás: aquí se refleja la misma regla en el estado local.
        setRecipes((prev) =>
          prev
            .filter((r) => !deletedRecipeIds.includes(r.id) || r.groupIds.some((gid) => gid !== id))
            .map((r) =>
              r.groupIds.includes(id) ? { ...r, groupIds: r.groupIds.filter((gid) => gid !== id) } : r
            )
        );
        return null;
      } catch (err) {
        return toErrorMessage(err);
      }
    },
    [user, groups]
  );

  // ---------- Asociaciones receta <-> grupo ----------
  const addRecipeToGroup = useCallback(async (recipeId: string, groupId: string) => {
    try {
      await api.addRecipeToGroup(recipeId, groupId);
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipeId && !r.groupIds.includes(groupId)
            ? { ...r, groupIds: [...r.groupIds, groupId] }
            : r
        )
      );
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId && !g.recipeIds.includes(recipeId)
            ? { ...g, recipeIds: [...g.recipeIds, recipeId] }
            : g
        )
      );
    } catch {
      // Silencioso: la interfaz ya refleja la intención del usuario.
    }
  }, []);

  const removeRecipeFromGroup = useCallback(async (recipeId: string, groupId: string) => {
    try {
      await api.removeRecipeFromGroup(recipeId, groupId);
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipeId
            ? { ...r, groupIds: r.groupIds.filter((gid) => gid !== groupId) }
            : r
        )
      );
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, recipeIds: g.recipeIds.filter((rid) => rid !== recipeId) }
            : g
        )
      );
    } catch {
      // Silencioso: la interfaz ya refleja la intención del usuario.
    }
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
