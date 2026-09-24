import { describe, it, expect } from 'vitest';
import {
  convertToBaseUnit,
  convertQuantity,
  areUnitsCompatible,
  formatQuantity,
} from '../unitConversion';

describe('Unit Conversion Utility', () => {
  describe('convertToBaseUnit', () => {
    it('converts weight units to base grams (g)', () => {
      expect(convertToBaseUnit(1.4, 'kg')).toEqual({
        qtyInBase: 1400,
        baseUnit: 'g',
        category: 'weight',
      });
      expect(convertToBaseUnit(250, 'g')).toEqual({
        qtyInBase: 250,
        baseUnit: 'g',
        category: 'weight',
      });
      expect(convertToBaseUnit(2, 'kilograms')).toEqual({
        qtyInBase: 2000,
        baseUnit: 'g',
        category: 'weight',
      });
    });

    it('converts volume units to base millilitres (ml)', () => {
      expect(convertToBaseUnit(1.5, 'l')).toEqual({
        qtyInBase: 1500,
        baseUnit: 'ml',
        category: 'volume',
      });
      expect(convertToBaseUnit(800, 'ml')).toEqual({
        qtyInBase: 800,
        baseUnit: 'ml',
        category: 'volume',
      });
      expect(convertToBaseUnit(0.5, 'litre')).toEqual({
        qtyInBase: 500,
        baseUnit: 'ml',
        category: 'volume',
      });
    });

    it('handles count units', () => {
      expect(convertToBaseUnit(5, 'pcs')).toEqual({
        qtyInBase: 5,
        baseUnit: 'pcs',
        category: 'count',
      });
    });
  });

  describe('convertQuantity', () => {
    it('converts kg to g and g to kg accurately', () => {
      expect(convertQuantity(1.4, 'kg', 'g')).toBe(1400);
      expect(convertQuantity(180, 'g', 'kg')).toBe(0.18);
      expect(convertQuantity(50, 'g', 'g')).toBe(50);
    });

    it('converts litres to ml and ml to litres accurately', () => {
      expect(convertQuantity(2, 'l', 'ml')).toBe(2000);
      expect(convertQuantity(40, 'ml', 'l')).toBe(0.04);
      expect(convertQuantity(900, 'ml', 'ml')).toBe(900);
    });

    it('handles case and whitespace insensitivity', () => {
      expect(convertQuantity(1.5, ' KG ', 'g')).toBe(1500);
      expect(convertQuantity(500, 'G', 'Kg')).toBe(0.5);
      expect(convertQuantity(1, 'LITRE', 'ml')).toBe(1000);
    });

    it('returns null for incompatible units', () => {
      expect(convertQuantity(500, 'g', 'ml')).toBeNull();
      expect(convertQuantity(1, 'kg', 'litre')).toBeNull();
      expect(convertQuantity(10, 'g', 'unknown_unit')).toBeNull();
    });
  });

  describe('areUnitsCompatible', () => {
    it('identifies compatible units', () => {
      expect(areUnitsCompatible('kg', 'g')).toBe(true);
      expect(areUnitsCompatible('g', 'kg')).toBe(true);
      expect(areUnitsCompatible('l', 'ml')).toBe(true);
      expect(areUnitsCompatible('ml', 'litres')).toBe(true);
    });

    it('identifies incompatible units', () => {
      expect(areUnitsCompatible('kg', 'ml')).toBe(false);
      expect(areUnitsCompatible('g', 'l')).toBe(false);
      expect(areUnitsCompatible('g', 'pcs')).toBe(false);
    });
  });

  describe('formatQuantity', () => {
    it('formats integer and decimal quantities cleanly', () => {
      expect(formatQuantity(1400)).toBe('1400');
      expect(formatQuantity(1.4)).toBe('1.4');
      expect(formatQuantity(0.18)).toBe('0.18');
      expect(formatQuantity(1.2200000000000002)).toBe('1.22');
    });
  });
});
