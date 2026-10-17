
export const LIMITS = {
  userName: { min: 2, max: 16 },
  email: { max: 100 },
  password: { min: 6, max: 16 },
  recipeTitle: { min: 3, max: 60 },
  recipeDescription: { max: 300 },
  category: { max: 40 },
  timeText: { max: 20 },
  ingredientName: { max: 20 },
  ingredientQuantity: { max: 20 },
  step: { max: 300 },
  groupName: { min: 3, max: 50 },
  groupDescription: { max: 200 },
} as const;

/** Validación de correo electrónico. */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
