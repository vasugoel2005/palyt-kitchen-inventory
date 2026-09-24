import { describe, it, expect } from 'vitest';
import {
  getDishAvailability,
  calculateMenuAvailability,
  isDishAvailable,
  orderDish,
  canDeleteIngredient,
  validateIngredientForm,
} from '../inventoryLogic';
import { IngredientStock, Recipe } from '../../types';
import initialStock from '../../data/stock.json';
import initialRecipes from '../../data/recipes.json';

describe('Kitchen Inventory Business Logic', () => {
  const stock: IngredientStock[] = JSON.parse(JSON.stringify(initialStock));
  const recipes: Recipe[] = JSON.parse(JSON.stringify(initialRecipes));

  describe('Menu Availability Calculation', () => {
    it('marks dish available when all its required ingredients are present and >= par', () => {
      // Paneer Butter Masala uses Paneer (1.4kg >= 0.5kg par), Tomatoes (6kg >= 1.5kg par),
      // Onions (8kg >= 2kg par), Cream (900ml >= 300ml par), Butter (900g >= 200g par),
      // Cashews (300g >= 250g par), Garam Masala (250g >= 50g par).
      const pbmRecipe = recipes.find((r) => r.dish === 'Paneer Butter Masala')!;
      const availability = getDishAvailability(pbmRecipe, stock);

      expect(availability.isAvailable).toBe(true);
      expect(availability.reasons).toHaveLength(0);
    });

    it('marks dish unavailable when an ingredient is below its par level', () => {
      // Chicken Biryani requires Chicken (stock: 0kg, par: 1kg) -> below par
      const biryaniRecipe = recipes.find((r) => r.dish === 'Chicken Biryani')!;
      const availability = getDishAvailability(biryaniRecipe, stock);

      expect(availability.isAvailable).toBe(false);
      expect(availability.reasons.some((r) => r.includes('Chicken is below par'))).toBe(true);
    });

    it('marks dish unavailable when a required ingredient is missing from stock completely', () => {
      // Veg Pulao and Jeera Rice require Cumin Seeds, which is not in stock.json
      const vegPulaoRecipe = recipes.find((r) => r.dish === 'Veg Pulao')!;
      const availability = getDishAvailability(vegPulaoRecipe, stock);

      expect(availability.isAvailable).toBe(false);
      expect(
        availability.reasons.some((r) => r.includes('Missing from stock: Cumin Seeds'))
      ).toBe(true);

      // Butter Naan requires Refined Flour, which is not in stock.json
      const butterNaanRecipe = recipes.find((r) => r.dish === 'Butter Naan')!;
      const naanAvailability = getDishAvailability(butterNaanRecipe, stock);
      expect(naanAvailability.isAvailable).toBe(false);
      expect(
        naanAvailability.reasons.some((r) => r.includes('Missing from stock: Refined Flour'))
      ).toBe(true);
    });

    it('calculates menu availability for the entire dataset', () => {
      const allAvailability = calculateMenuAvailability(recipes, stock);
      expect(allAvailability).toHaveLength(6);

      const pbm = allAvailability.find((d) => d.dish === 'Paneer Butter Masala');
      const shahi = allAvailability.find((d) => d.dish === 'Shahi Paneer Korma');
      const biryani = allAvailability.find((d) => d.dish === 'Chicken Biryani');

      expect(pbm?.isAvailable).toBe(true);
      expect(shahi?.isAvailable).toBe(true);
      expect(biryani?.isAvailable).toBe(false);
    });
  });

  describe('Order Flow & Inventory Deduction', () => {
    it('deducts exact recipe ingredient quantities in compatible units', () => {
      const workingStock: IngredientStock[] = JSON.parse(JSON.stringify(initialStock));
      const pbmRecipe = recipes.find((r) => r.dish === 'Paneer Butter Masala')!;

      // Initial: Paneer 1.4 kg, Cashews 300 g
      const orderResult = orderDish(pbmRecipe, workingStock);

      expect(orderResult.success).toBe(true);
      expect(orderResult.updatedStock).toBeDefined();

      const newStock = orderResult.updatedStock!;
      const paneer = newStock.find((i) => i.name === 'Paneer')!;
      const cashews = newStock.find((i) => i.name === 'Cashews')!;
      const tomatoes = newStock.find((i) => i.name === 'Tomatoes')!;
      const butter = newStock.find((i) => i.name === 'Butter')!;

      // 1.4 kg - 180 g (0.18 kg) = 1.22 kg
      expect(paneer.qty).toBe(1.22);
      // 300 g - 15 g = 285 g
      expect(cashews.qty).toBe(285);
      // 6 kg - 150 g (0.15 kg) = 5.85 kg
      expect(tomatoes.qty).toBe(5.85);
      // 900 g - 30 g = 870 g
      expect(butter.qty).toBe(870);
    });

    it('causes a dish to become unavailable when an order pushes an ingredient below par', () => {
      let currentStock: IngredientStock[] = JSON.parse(JSON.stringify(initialStock));
      const shahiRecipe = recipes.find((r) => r.dish === 'Shahi Paneer Korma')!;

      // Cashews in stock: 300g, par: 250g.
      // Shahi Paneer Korma requires 40g Cashews.
      // Order 1: 300g - 40g = 260g (>= 250g par) -> Still available.
      const order1 = orderDish(shahiRecipe, currentStock);
      expect(order1.success).toBe(true);
      currentStock = order1.updatedStock!;
      expect(isDishAvailable(shahiRecipe, currentStock)).toBe(true);

      // Order 2: 260g - 40g = 220g (< 250g par) -> Becomes UNAVAILABLE!
      const order2 = orderDish(shahiRecipe, currentStock);
      expect(order2.success).toBe(true);
      currentStock = order2.updatedStock!;

      expect(isDishAvailable(shahiRecipe, currentStock)).toBe(false);
      const availability = getDishAvailability(shahiRecipe, currentStock);
      expect(availability.reasons.some((r) => r.includes('Cashews is below par level'))).toBe(
        true
      );
    });

    it('automatically affects all other dishes that share the depleted ingredient', () => {
      let currentStock: IngredientStock[] = JSON.parse(JSON.stringify(initialStock));
      const shahiRecipe = recipes.find((r) => r.dish === 'Shahi Paneer Korma')!;
      const pbmRecipe = recipes.find((r) => r.dish === 'Paneer Butter Masala')!;

      // Order Shahi Paneer twice to deplete Cashews to 220g (< 250g par)
      currentStock = orderDish(shahiRecipe, currentStock).updatedStock!;
      currentStock = orderDish(shahiRecipe, currentStock).updatedStock!;

      // Both dishes require Cashews, so BOTH must now be UNAVAILABLE!
      expect(isDishAvailable(shahiRecipe, currentStock)).toBe(false);
      expect(isDishAvailable(pbmRecipe, currentStock)).toBe(false);
    });

    it('rejects an order if the dish is currently unavailable', () => {
      const workingStock: IngredientStock[] = JSON.parse(JSON.stringify(initialStock));
      const biryaniRecipe = recipes.find((r) => r.dish === 'Chicken Biryani')!;

      const result = orderDish(biryaniRecipe, workingStock);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Cannot order "Chicken Biryani"');
      expect(result.updatedStock).toBeUndefined();
    });
  });

  describe('Restocking & Par Level Adjustments', () => {
    it('restocking an ingredient restores availability for all dishes using it', () => {
      let currentStock: IngredientStock[] = JSON.parse(JSON.stringify(initialStock));
      const biryaniRecipe = recipes.find((r) => r.dish === 'Chicken Biryani')!;

      // Initially unavailable because Chicken is 0 kg (par 1 kg)
      expect(isDishAvailable(biryaniRecipe, currentStock)).toBe(false);

      // Restock chicken to 2 kg (>= 1 kg par)
      currentStock = currentStock.map((item) =>
        item.name === 'Chicken' ? { ...item, qty: 2 } : item
      );

      // Now all ingredients for Chicken Biryani are >= par (Chicken, Basmati Rice, Yoghurt, Onions, Ghee, Mint, Garam Masala)
      expect(isDishAvailable(biryaniRecipe, currentStock)).toBe(true);
    });

    it('raising a par level makes a dish unavailable without any order taking place', () => {
      let currentStock: IngredientStock[] = JSON.parse(JSON.stringify(initialStock));
      const pbmRecipe = recipes.find((r) => r.dish === 'Paneer Butter Masala')!;

      // Initially available (Paneer = 1.4kg, par = 0.5kg)
      expect(isDishAvailable(pbmRecipe, currentStock)).toBe(true);

      // Raise Paneer par level to 2.0 kg (> 1.4 kg stock)
      currentStock = currentStock.map((item) =>
        item.name === 'Paneer' ? { ...item, par: 2.0 } : item
      );

      // Now Paneer is below par level -> Dish immediately becomes unavailable
      expect(isDishAvailable(pbmRecipe, currentStock)).toBe(false);
      const status = getDishAvailability(pbmRecipe, currentStock);
      expect(status.reasons.some((r) => r.includes('Paneer is below par level'))).toBe(true);

      // Lower par back to 1.0 kg (<= 1.4 kg stock)
      currentStock = currentStock.map((item) =>
        item.name === 'Paneer' ? { ...item, par: 1.0 } : item
      );
      expect(isDishAvailable(pbmRecipe, currentStock)).toBe(true);
    });
  });

  describe('Ingredient Deletion Rules', () => {
    it('allows deleting ingredients not referenced by any recipe (e.g. Bay Leaves, Saffron)', () => {
      const bayLeavesCheck = canDeleteIngredient('Bay Leaves', recipes);
      expect(bayLeavesCheck.canDelete).toBe(true);
      expect(bayLeavesCheck.referencedRecipes).toHaveLength(0);

      const saffronCheck = canDeleteIngredient('Saffron', recipes);
      expect(saffronCheck.canDelete).toBe(true);
      expect(saffronCheck.referencedRecipes).toHaveLength(0);
    });

    it('blocks deleting ingredients used by recipes and lists referencing dishes', () => {
      const cashewsCheck = canDeleteIngredient('Cashews', recipes);
      expect(cashewsCheck.canDelete).toBe(false);
      expect(cashewsCheck.referencedRecipes).toEqual([
        'Paneer Butter Masala',
        'Shahi Paneer Korma',
      ]);
      expect(cashewsCheck.reason).toBe(
        'Cannot delete "Cashews" because it is used by 2 recipes: Paneer Butter Masala, Shahi Paneer Korma.'
      );

      const paneerCheck = canDeleteIngredient('Paneer', recipes);
      expect(paneerCheck.canDelete).toBe(false);
      expect(paneerCheck.referencedRecipes).toContain('Paneer Butter Masala');
      expect(paneerCheck.referencedRecipes).toContain('Shahi Paneer Korma');
    });
  });

  describe('Form Validation', () => {
    it('validates required fields and numerical constraints', () => {
      // Empty data
      const resEmpty = validateIngredientForm({ name: '', qty: '', unit: '', par: '' }, stock);
      expect(resEmpty.isValid).toBe(false);
      expect(resEmpty.errors.name).toBeDefined();
      expect(resEmpty.errors.qty).toBeDefined();
      expect(resEmpty.errors.unit).toBeDefined();
      expect(resEmpty.errors.par).toBeDefined();

      // Negative numbers
      const resNeg = validateIngredientForm(
        { name: 'Garlic', qty: -5, unit: 'g', par: -1 },
        stock
      );
      expect(resNeg.isValid).toBe(false);
      expect(resNeg.errors.qty).toBeDefined();
      expect(resNeg.errors.par).toBeDefined();

      // Duplicate name
      const resDup = validateIngredientForm(
        { name: 'Paneer', qty: 2, unit: 'kg', par: 1 },
        stock
      );
      expect(resDup.isValid).toBe(false);
      expect(resDup.errors.name).toContain('already exists');

      // Valid new ingredient
      const resValid = validateIngredientForm(
        { name: 'Cardamom', qty: 50, unit: 'g', par: 20 },
        stock
      );
      expect(resValid.isValid).toBe(true);
      expect(resValid.errors).toEqual({});
    });
  });
});
