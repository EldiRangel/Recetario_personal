import AsyncStorage from '@react-native-async-storage/async-storage';

import { Group, Recipe, User } from '@/types';

/**
 * Cliente del backend en la nube.
 *
 * La URL se toma de la variable EXPO_PUBLIC_API_URL (archivo .env). Si no
 * está definida se usa localhost para poder probar en local.
 */
const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/+$/, '');

/** Clave donde se guarda el token JWT en el dispositivo. */
export const TOKEN_STORAGE_KEY = 'recetario:token:v1';

let authToken: string | null = null;

/** Guarda (o borra) el token en memoria para las peticiones siguientes. */
export function setAuthToken(token: string | null) {
  authToken = token;
}

/** Error de la API con el mensaje del servidor y el código HTTP. */
export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Revisa tu conexión a internet.');
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch {
    // Respuesta sin cuerpo JSON.
  }

  if (!response.ok) {
    throw new ApiError(data?.error ?? 'Error del servidor.', response.status);
  }
  return data as T;
}

// ---------- Autenticación ----------

export function login(email: string, password: string) {
  return request<{ token: string; user: User }>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export function register(name: string, email: string, password: string) {
  return request<{ token: string; user: User }>('/api/auth/register', {
    method: 'POST',
    body: { name, email, password },
  });
}

export function me() {
  return request<{ user: User }>('/api/profile');
}

// ---------- Perfil ----------

export function updateProfile(updates: { name?: string; email?: string; password?: string }) {
  return request<{ user: User }>('/api/profile', { method: 'PUT', body: updates });
}

export function setAvatar(avatar: string | null) {
  return request<{ user: User }>('/api/profile/avatar', { method: 'PUT', body: { avatar } });
}

/** Sube un archivo local (file://...) como avatar usando multipart. */
export async function uploadAvatar(localUri: string): Promise<User> {
  const formData = new FormData();
  formData.append('avatar', {
    uri: localUri,
    name: 'avatar.jpg',
    type: 'image/jpeg',
  } as any);

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/api/profile/avatar`, {
      method: 'POST',
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      body: formData,
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Revisa tu conexión a internet.');
  }

  const data: any = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(data?.error ?? 'No se pudo subir la imagen.', response.status);
  }
  return data.user as User;
}

export function deleteAccount() {
  return request<{ ok: boolean }>('/api/profile', { method: 'DELETE' });
}

// ---------- Usuarios ----------

export function listUsers() {
  return request<{ users: User[] }>('/api/users');
}

// ---------- Recetas ----------

export function listRecipes() {
  return request<{ recipes: Recipe[] }>('/api/recipes');
}

export function createRecipe(recipe: {
  title: string;
  description: string;
  ingredients: Recipe['ingredients'];
  steps: string[];
  category?: string;
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  image?: string;
  isPublic: boolean;
  groupIds: string[];
}) {
  return request<{ recipe: Recipe }>('/api/recipes', { method: 'POST', body: recipe });
}

export function updateRecipe(id: string, updates: Partial<Recipe>) {
  return request<{ recipe: Recipe }>(`/api/recipes/${id}`, { method: 'PUT', body: updates });
}

export function deleteRecipe(id: string) {
  return request<{ ok: boolean }>(`/api/recipes/${id}`, { method: 'DELETE' });
}

export function addRecipeToGroup(recipeId: string, groupId: string) {
  return request<{ ok: boolean }>(`/api/recipes/${recipeId}/groups/${groupId}`, { method: 'POST' });
}

export function removeRecipeFromGroup(recipeId: string, groupId: string) {
  return request<{ ok: boolean }>(`/api/recipes/${recipeId}/groups/${groupId}`, {
    method: 'DELETE',
  });
}

// ---------- Grupos ----------

export function listGroups() {
  return request<{ groups: Group[] }>('/api/groups');
}

export function createGroup(group: { name: string; description?: string }) {
  return request<{ group: Group }>('/api/groups', { method: 'POST', body: group });
}

export function updateGroup(id: string, updates: { name?: string; description?: string }) {
  return request<{ group: Group }>(`/api/groups/${id}`, { method: 'PUT', body: updates });
}

export function deleteGroup(id: string) {
  return request<{ ok: boolean }>(`/api/groups/${id}`, { method: 'DELETE' });
}

// ---------- Sesión ----------

export async function clearStoredToken() {
  setAuthToken(null);
  try {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Si falla el almacenamiento local no hay nada más que hacer.
  }
}
