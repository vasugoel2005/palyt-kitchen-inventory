import React, { useState } from 'react';
import type { IngredientStock } from '../types';
import { validateIngredientForm } from '../logic/inventoryLogic';
import { X } from 'lucide-react';

interface AddIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newIngredient: IngredientStock) => void;
  existingStock: IngredientStock[];
}

export const AddIngredientModal: React.FC<AddIngredientModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  existingStock,
}) => {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('g');
  const [par, setPar] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateIngredientForm(
      { name, qty, unit, par },
      existingStock
    );

    if (!validation.isValid) {
      setErrors(validation.errors as Record<string, string>);
      return;
    }

    onAdd({
      name: name.trim(),
      qty: parseFloat(qty),
      unit: unit.trim().toLowerCase(),
      par: parseFloat(par),
    });

    // Reset and close
    setName('');
    setQty('');
    setPar('');
    setErrors({});
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New Ingredient</h3>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="ingredient-form">
          <div className="form-group">
            <label htmlFor="ing-name">Ingredient Name *</label>
            <input
              id="ing-name"
              type="text"
              placeholder="e.g. Cumin Seeds"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={errors.name ? 'input-error' : ''}
              autoFocus
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ing-qty">Initial Quantity *</label>
              <input
                id="ing-qty"
                type="number"
                step="any"
                min="0"
                placeholder="e.g. 500"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className={errors.qty ? 'input-error' : ''}
              />
              {errors.qty && <span className="error-text">{errors.qty}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="ing-unit">Unit *</label>
              <select
                id="ing-unit"
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
            <label htmlFor="ing-par">Par Level (Threshold Buffer) *</label>
            <input
              id="ing-par"
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 100"
              value={par}
              onChange={(e) => setPar(e.target.value)}
              className={errors.par ? 'input-error' : ''}
            />
            <small className="help-text">
              Dishes requiring this ingredient become unavailable if stock falls below this level.
            </small>
            {errors.par && <span className="error-text">{errors.par}</span>}
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Ingredient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
