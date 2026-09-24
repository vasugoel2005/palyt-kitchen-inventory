import {
  IngredientStock,
  Recipe,
  DishAvailability,
  IngredientCheckDetail,
  OrderResult,
  DeleteCheckResult,
  FormValidationResult,
} from '../types';
import {
  convertToBaseUnit,
  convertQuantity,
  areUnitsCompatible,
  formatQuantity,
} from './unitConversion';

/**
 * Finds an ingredient in stock by name (case-insensitive)
 */
export function findStockItem(
  stock: IngredientStock[],
  name: string
): IngredientStock | undefined {
  const normalized = name.trim().toLowerCase();
  return stock.find((item) => item.name.trim().toLowerCase() === normalized);
}

/**
 * Evaluates the availability of a single dish based on current kitchen stock.
 *
 * A dish is AVAILABLE only when:
 * 1. Every ingredient it requires is present in stock.
 * 2. Units between stock and recipe are compatible.
 * 3. Stock quantity is greater than or equal to the ingredient's par level.
 * 4. Stock quantity is sufficient to prepare at least one full portion.
 */
export function getDishAvailability(
  recipe: Recipe,
  stock: IngredientStock[]
): DishAvailability {
  const reasons: string[] = [];
  const ingredientDetails: IngredientCheckDetail[] = [];
  let isAvailable = true;

  for (const ingredient of recipe.ingredients) {
    const stockItem = findStockItem(stock, ingredient.name);

    if (!stockItem) {
      // Ingredient completely missing in stock
      isAvailable = false;
      const reason = `Missing from stock: ${ingredient.name}`;
      reasons.push(reason);
      ingredientDetails.push({
        name: ingredient.name,
        requiredQty: ingredient.qty,
        requiredUnit: ingredient.unit,
        stockQty: 0,
        stockUnit: ingredient.unit,
        par: 0,
        isMissing: true,
        isBelowPar: true,
        isInsufficientForPortion: true,
        isIncompatibleUnit: false,
      });
      continue;
    }

    // Check unit compatibility
    if (!areUnitsCompatible(stockItem.unit, ingredient.unit)) {
      isAvailable = false;
      const reason = `Incompatible units for ${ingredient.name} (stock is in ${stockItem.unit}, recipe needs ${ingredient.unit})`;
      reasons.push(reason);
      ingredientDetails.push({
        name: ingredient.name,
        requiredQty: ingredient.qty,
        requiredUnit: ingredient.unit,
        stockQty: stockItem.qty,
        stockUnit: stockItem.unit,
        par: stockItem.par,
        isMissing: false,
        isBelowPar: false,
        isInsufficientForPortion: false,
        isIncompatibleUnit: true,
      });
      continue;
    }

    // Convert everything to base unit for uniform comparison
    const stockBase = convertToBaseUnit(stockItem.qty, stockItem.unit);
    const parBase = convertToBaseUnit(stockItem.par, stockItem.unit);
    const reqBase = convertToBaseUnit(ingredient.qty, ingredient.unit);

    const isBelowPar = stockBase.qtyInBase < parBase.qtyInBase;
    const isInsufficient = stockBase.qtyInBase < reqBase.qtyInBase;

    if (isBelowPar) {
      isAvailable = false;
      reasons.push(
        `${ingredient.name} is below par level (${formatQuantity(stockItem.qty)} ${stockItem.unit} in stock < ${formatQuantity(stockItem.par)} ${stockItem.unit} par)`
      );
    } else if (isInsufficient) {
      isAvailable = false;
      reasons.push(
        `Insufficient ${ingredient.name} for 1 portion (${formatQuantity(stockItem.qty)} ${stockItem.unit} < ${formatQuantity(ingredient.qty)} ${ingredient.unit} required)`
      );
    }

    ingredientDetails.push({
      name: ingredient.name,
      requiredQty: ingredient.qty,
      requiredUnit: ingredient.unit,
      stockQty: stockItem.qty,
      stockUnit: stockItem.unit,
      par: stockItem.par,
      isMissing: false,
      isBelowPar,
      isInsufficientForPortion: isInsufficient,
      isIncompatibleUnit: false,
    });
  }

  return {
    dish: recipe.dish,
    price: recipe.price,
    isAvailable,
    reasons,
    ingredientDetails,
  };
}

/**
 * Calculates menu availability for all recipes against current stock
 */
export function calculateMenuAvailability(
  recipes: Recipe[],
  stock: IngredientStock[]
): DishAvailability[] {
  return recipes.map((recipe) => getDishAvailability(recipe, stock));
}

/**
 * Checks if a specific dish can be ordered/is available
 */
export function isDishAvailable(recipe: Recipe, stock: IngredientStock[]): boolean {
  return getDishAvailability(recipe, stock).isAvailable;
}

/**
 * Executes an order for a dish:
 * 1. Verifies availability.
 * 2. Deducts recipe ingredient amounts from stock in the correct units.
 * 3. Returns updated stock array and deduction breakdown.
 */
export function orderDish(
  recipe: Recipe,
  currentStock: IngredientStock[]
): OrderResult {
  const availability = getDishAvailability(recipe, currentStock);

  if (!availability.isAvailable) {
    return {
      success: false,
      message: `Cannot order "${recipe.dish}": ${availability.reasons.join('; ')}`,
      dishName: recipe.dish,
    };
  }

  const deductions: {
    ingredient: string;
    deductedQty: number;
    unit: string;
    remainingQty: number;
  }[] = [];

  // Create a deep copy of stock to mutate safely
  const updatedStock = currentStock.map((item) => ({ ...item }));

  for (const req of recipe.ingredients) {
    const stockItem = updatedStock.find(
      (item) => item.name.trim().toLowerCase() === req.name.trim().toLowerCase()
    );

    if (!stockItem) {
      return {
        success: false,
        message: `Internal error: Stock item "${req.name}" not found during deduction.`,
        dishName: recipe.dish,
      };
    }

    // Convert recipe requirement to stock item's unit
    const deductInStockUnit = convertQuantity(req.qty, req.unit, stockItem.unit);

    if (deductInStockUnit === null) {
      return {
        success: false,
        message: `Incompatible units for "${req.name}": cannot convert ${req.unit} to ${stockItem.unit}.`,
        dishName: recipe.dish,
      };
    }

    const newQty = Math.max(0, stockItem.qty - deductInStockUnit);
    // Round to avoid floating point anomalies
    stockItem.qty = Math.round(newQty * 10000) / 10000;

    deductions.push({
      ingredient: stockItem.name,
      deductedQty: deductInStockUnit,
      unit: stockItem.unit,
      remainingQty: stockItem.qty,
    });
  }

  return {
    success: true,
    message: `Successfully ordered "${recipe.dish}". Stock updated.`,
    dishName: recipe.dish,
    updatedStock,
    deductions,
  };
}

/**
 * Checks if an ingredient can be safely deleted.
 * Prevent deletion if any recipe references it.
 */
export function canDeleteIngredient(
  ingredientName: string,
  recipes: Recipe[]
): DeleteCheckResult {
  const normalized = ingredientName.trim().toLowerCase();
  const referencedRecipes: string[] = [];

  for (const recipe of recipes) {
    const uses = recipe.ingredients.some(
      (ing) => ing.name.trim().toLowerCase() === normalized
    );
    if (uses) {
      referencedRecipes.push(recipe.dish);
    }
  }

  if (referencedRecipes.length > 0) {
    const count = referencedRecipes.length;
    const recipeText = count === 1 ? '1 recipe' : `${count} recipes`;
    return {
      canDelete: false,
      referencedRecipes,
      reason: `Cannot delete "${ingredientName}" because it is used by ${recipeText}: ${referencedRecipes.join(', ')}.`,
    };
  }

  return {
    canDelete: true,
    referencedRecipes: [],
  };
}

/**
 * Validates ingredient input for adding or editing
 */
export function validateIngredientForm(
  data: {
    name: string;
    qty: number | string;
    unit: string;
    par: number | string;
  },
  existingStock: IngredientStock[],
  isEditingName?: string
): FormValidationResult {
  const errors: FormValidationResult['errors'] = {};

  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (!name) {
    errors.name = 'Ingredient name is required.';
  } else {
    // Check for duplicate names (excluding current item if editing)
    const isDuplicate = existingStock.some((item) => {
      if (isEditingName && item.name.trim().toLowerCase() === isEditingName.trim().toLowerCase()) {
        return false;
      }
      return item.name.trim().toLowerCase() === name.toLowerCase();
    });

    if (isDuplicate) {
      errors.name = `An ingredient named "${name}" already exists.`;
    }
  }

  const numQty = typeof data.qty === 'number' ? data.qty : parseFloat(data.qty);
  if (isNaN(numQty) || numQty < 0) {
    errors.qty = 'Quantity must be a valid number >= 0.';
  }

  const unit = typeof data.unit === 'string' ? data.unit.trim() : '';
  if (!unit) {
    errors.unit = 'Unit is required (e.g., kg, g, ml, l).';
  }

  const numPar = typeof data.par === 'number' ? data.par : parseFloat(data.par);
  if (isNaN(numPar) || numPar < 0) {
    errors.par = 'Par level must be a valid number >= 0.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
