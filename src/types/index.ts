export interface Ingredient {
  id: string;
  name: string;
  quantity: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  createdAt: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: Ingredient[];
  steps: string[];
  category?: string;
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  image?: string;
  groupIds: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  recipeIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
