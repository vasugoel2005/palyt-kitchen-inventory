import React, { useState, useEffect } from 'react';
import type { IngredientStock } from '../types';
import { validateIngredientForm } from '../logic/inventoryLogic';
import { X } from 'lucide-react';

interface EditIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient: IngredientStock | null;
  onSave: (originalName: string, updated: IngredientStock) => void;
  existingStock: IngredientStock[];
}

export const EditIngredientModal: React.FC<EditIngredientModalProps> = ({
  isOpen,
  onClose,
  ingredient,
  onSave,
  existingStock,
}) => {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('g');
  const [par, setPar] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (ingredient) {
      setName(ingredient.name);
      setQty(ingredient.qty.toString());
      setUnit(ingredient.unit);
      setPar(ingredient.par.toString());
      setErrors({});
    }
  }, [ingredient]);

  if (!isOpen || !ingredient) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateIngredientForm(
      { name, qty, unit, par },
      existingStock,
      ingredient.name
    );

    if (!validation.isValid) {
      setErrors(validation.errors as Record<string, string>);
      return;
    }

    onSave(ingredient.name, {
      name: name.trim(),
      qty: parseFloat(qty),
      unit: unit.trim().toLowerCase(),
      par: parseFloat(par),
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Ingredient: {ingredient.name}</h3>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="ingredient-form">
          <div className="form-group">
            <label htmlFor="edit-ing-name">Ingredient Name *</label>
            <input
              id="edit-ing-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? 'input-error' : ''}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-ing-qty">Current Stock Quantity *</label>
              <input
                id="edit-ing-qty"
                type="number"
                step="any"
                min="0"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className={errors.qty ? 'input-error' : ''}
              />
              {errors.qty && <span className="error-text">{errors.qty}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="edit-ing-unit">Unit *</label>
              <select
                id="edit-ing-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className={errors.unit ? 'input-error' : ''}
              >
                <option value="g">Grams (g)</option>
                <option value="kg">Kilograms (kg)</option>
                <option value="ml">Millilitres (ml)</option>
                <option value="l">Litres (l)</option>
                <option value="pcs">Pieces (pcs)</option>
              </select>
              {errors.unit && <span className="error-text">{errors.unit}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="edit-ing-par">Par Level (Buffer) *</label>
            <input
              id="edit-ing-par"
              type="number"
              step="any"
              min="0"
              value={par}
              onChange={(e) => setPar(e.target.value)}
              className={errors.par ? 'input-error' : ''}
            />
            <small className="help-text">
              Raising par level above current stock ({qty} {unit}) will immediately make dependent dishes unavailable.
            </small>
            {errors.par && <span className="error-text">{errors.par}</span>}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
