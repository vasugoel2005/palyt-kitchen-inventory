export interface IngredientStock {
  name: string;
  qty: number;
  unit: string;
  par: number;
}

export interface RecipeIngredient {
  name: string;
  qty: number;
  unit: string;
}

export interface Recipe {
  dish: string;
  price: number;
  ingredients: RecipeIngredient[];
}

export interface IngredientCheckDetail {
  name: string;
  requiredQty: number;
  requiredUnit: string;
  stockQty: number;
  stockUnit: string;
  par: number;
  isMissing: boolean;
  isBelowPar: boolean;
  isInsufficientForPortion: boolean;
  isIncompatibleUnit: boolean;
}

export interface DishAvailability {
  dish: string;
  price: number;
  isAvailable: boolean;
  reasons: string[];
  ingredientDetails: IngredientCheckDetail[];
}

export interface OrderResult {
  success: boolean;
  message: string;
  updatedStock?: IngredientStock[];
  dishName: string;
  deductions?: {
    ingredient: string;
    deductedQty: number;
    unit: string;
    remainingQty: number;
  }[];
}

export interface DeleteCheckResult {
  canDelete: boolean;
  reason?: string;
  referencedRecipes?: string[];
}

export interface FormValidationResult {
  isValid: boolean;
  errors: {
    name?: string;
    qty?: string;
    unit?: string;
    par?: string;
  };
}
