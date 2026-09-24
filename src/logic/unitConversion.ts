/**
 * Unit conversion utility for kitchen inventory and recipes.
 * Normalizes compatible units (e.g. kg <-> g, l <-> ml).
 * Incompatible units (e.g. g <-> ml) are never converted.
 */

export type UnitCategory = 'weight' | 'volume' | 'count' | 'unknown';

interface UnitDefinition {
  canonical: string;
  baseUnit: string;
  factorToBase: number;
  category: UnitCategory;
}

const UNIT_MAP: Record<string, UnitDefinition> = {
  // Weight units -> base unit: g (grams)
  g: { canonical: 'g', baseUnit: 'g', factorToBase: 1, category: 'weight' },
  gram: { canonical: 'g', baseUnit: 'g', factorToBase: 1, category: 'weight' },
  grams: { canonical: 'g', baseUnit: 'g', factorToBase: 1, category: 'weight' },
  gm: { canonical: 'g', baseUnit: 'g', factorToBase: 1, category: 'weight' },
  gms: { canonical: 'g', baseUnit: 'g', factorToBase: 1, category: 'weight' },
  kg: { canonical: 'kg', baseUnit: 'g', factorToBase: 1000, category: 'weight' },
  kilo: { canonical: 'kg', baseUnit: 'g', factorToBase: 1000, category: 'weight' },
  kilos: { canonical: 'kg', baseUnit: 'g', factorToBase: 1000, category: 'weight' },
  kilogram: { canonical: 'kg', baseUnit: 'g', factorToBase: 1000, category: 'weight' },
  kilograms: { canonical: 'kg', baseUnit: 'g', factorToBase: 1000, category: 'weight' },

  // Volume units -> base unit: ml (millilitres)
  ml: { canonical: 'ml', baseUnit: 'ml', factorToBase: 1, category: 'volume' },
  millilitre: { canonical: 'ml', baseUnit: 'ml', factorToBase: 1, category: 'volume' },
  millilitres: { canonical: 'ml', baseUnit: 'ml', factorToBase: 1, category: 'volume' },
  milliliter: { canonical: 'ml', baseUnit: 'ml', factorToBase: 1, category: 'volume' },
  milliliters: { canonical: 'ml', baseUnit: 'ml', factorToBase: 1, category: 'volume' },
  l: { canonical: 'l', baseUnit: 'ml', factorToBase: 1000, category: 'volume' },
  litre: { canonical: 'l', baseUnit: 'ml', factorToBase: 1000, category: 'volume' },
  litres: { canonical: 'l', baseUnit: 'ml', factorToBase: 1000, category: 'volume' },
  liter: { canonical: 'l', baseUnit: 'ml', factorToBase: 1000, category: 'volume' },
  liters: { canonical: 'l', baseUnit: 'ml', factorToBase: 1000, category: 'volume' },
  lt: { canonical: 'l', baseUnit: 'ml', factorToBase: 1000, category: 'volume' },

  // Count units -> base unit: pcs
  pc: { canonical: 'pcs', baseUnit: 'pcs', factorToBase: 1, category: 'count' },
  pcs: { canonical: 'pcs', baseUnit: 'pcs', factorToBase: 1, category: 'count' },
  piece: { canonical: 'pcs', baseUnit: 'pcs', factorToBase: 1, category: 'count' },
  pieces: { canonical: 'pcs', baseUnit: 'pcs', factorToBase: 1, category: 'count' },
  unit: { canonical: 'pcs', baseUnit: 'pcs', factorToBase: 1, category: 'count' },
  units: { canonical: 'pcs', baseUnit: 'pcs', factorToBase: 1, category: 'count' },
};

/**
 * Standardizes unit string format
 */
export function getUnitDefinition(unit: string): UnitDefinition | null {
  if (!unit || typeof unit !== 'string') return null;
  const cleaned = unit.trim().toLowerCase();
  return UNIT_MAP[cleaned] || null;
}

/**
 * Checks if two unit strings belong to the same measurable category
 */
export function areUnitsCompatible(unitA: string, unitB: string): boolean {
  const defA = getUnitDefinition(unitA);
  const defB = getUnitDefinition(unitB);

  if (!defA || !defB) {
    // If exact string match and unknown, consider compatible as identity
    return unitA.trim().toLowerCase() === unitB.trim().toLowerCase();
  }

  return defA.category === defB.category;
}

/**
 * Converts a given quantity and unit to its canonical base unit (g, ml, pcs)
 */
export function convertToBaseUnit(
  qty: number,
  unit: string
): { qtyInBase: number; baseUnit: string; category: UnitCategory } {
  const def = getUnitDefinition(unit);

  if (!def) {
    // Unknown unit: cannot convert to a known base unit, returns raw
    return {
      qtyInBase: qty,
      baseUnit: unit.trim().toLowerCase(),
      category: 'unknown',
    };
  }

  const rawBase = qty * def.factorToBase;
  // Clean floating point rounding errors (e.g. 1.4 * 1000 = 1400)
  const qtyInBase = Math.round(rawBase * 10000) / 10000;

  return {
    qtyInBase,
    baseUnit: def.baseUnit,
    category: def.category,
  };
}

/**
 * Converts quantity from source unit to target unit.
 * Returns null if units are not compatible.
 */
export function convertQuantity(qty: number, fromUnit: string, toUnit: string): number | null {
  const fromDef = getUnitDefinition(fromUnit);
  const toDef = getUnitDefinition(toUnit);

  const cleanFrom = fromUnit.trim().toLowerCase();
  const cleanTo = toUnit.trim().toLowerCase();

  if (cleanFrom === cleanTo) {
    return qty;
  }

  if (!fromDef || !toDef) {
    return null;
  }

  if (fromDef.category !== toDef.category) {
    return null;
  }

  // Convert to base, then to target unit
  const inBase = qty * fromDef.factorToBase;
  const inTarget = inBase / toDef.factorToBase;

  // Clean float issues (e.g., round to 6 decimal places)
  return Math.round(inTarget * 1000000) / 1000000;
}

/**
 * Helper to round display numbers cleanly
 */
export function formatQuantity(qty: number): string {
  if (Number.isInteger(qty)) return qty.toString();
  // Strip trailing zeros after decimal
  return parseFloat(qty.toFixed(4)).toString();
}
