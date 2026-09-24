import React, { useState } from 'react';
import type { Recipe, IngredientStock, DishAvailability } from '../types';
import { calculateMenuAvailability } from '../logic/inventoryLogic';
import { formatQuantity } from '../logic/unitConversion';
import { ShoppingBag, ChevronDown, ChevronUp, Check, AlertTriangle, AlertCircle } from 'lucide-react';

interface MenuGridProps {
  recipes: Recipe[];
  stock: IngredientStock[];
  onOrderDish: (recipe: Recipe) => void;
  lastOrderedDish: string | null;
}

export const MenuGrid: React.FC<MenuGridProps> = ({
  recipes,
  stock,
  onOrderDish,
  lastOrderedDish,
}) => {
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);

  const menuAvailability: DishAvailability[] = calculateMenuAvailability(recipes, stock);

  const toggleRecipeExpand = (dishName: string) => {
    setExpandedRecipe(expandedRecipe === dishName ? null : dishName);
  };

  return (
    <div className="card menu-section">
      <div className="section-header">
        <div>
          <h2>Diner Menu & Live Availability</h2>
          <p className="section-subtitle">
            {menuAvailability.filter((d) => d.isAvailable).length} of {recipes.length} dishes available to order
          </p>
        </div>
      </div>

      <div className="menu-grid" id="menu-grid">
        {recipes.map((recipe) => {
          const status = menuAvailability.find((d) => d.dish === recipe.dish)!;
          const isExpanded = expandedRecipe === recipe.dish;
          const wasJustOrdered = lastOrderedDish === recipe.dish;

          return (
            <div
              key={recipe.dish}
              className={`dish-card ${status.isAvailable ? 'dish-available' : 'dish-unavailable'} ${
                wasJustOrdered ? 'dish-just-ordered' : ''
              }`}
              id={`dish-card-${recipe.dish.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="dish-card-main">
                <div className="dish-card-header">
                  <h3 className="dish-title">{recipe.dish}</h3>
                  <span className="dish-price">₹{recipe.price}</span>
                </div>

                <div className="dish-status-indicator">
                  {status.isAvailable ? (
                    <span className="status-badge badge-available">
                      <Check size={14} /> AVAILABLE
                    </span>
                  ) : (
                    <span className="status-badge badge-unavailable">
                      <AlertTriangle size={14} /> UNAVAILABLE
                    </span>
                  )}
                </div>

                {!status.isAvailable && status.reasons.length > 0 && (
                  <div className="unavailable-reason-box">
                    <div className="reason-title">
                      <AlertCircle size={13} /> Why it cannot be ordered:
                    </div>
                    <ul className="reason-list">
                      {status.reasons.map((reason, idx) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="dish-ingredients-summary">
                  <button
                    className="toggle-recipe-btn"
                    onClick={() => toggleRecipeExpand(recipe.dish)}
                    type="button"
                  >
                    <span>Recipe Breakdown ({recipe.ingredients.length} items)</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {isExpanded && (
                    <div className="recipe-details-panel">
                      <table className="mini-recipe-table">
                        <thead>
                          <tr>
                            <th>Ingredient</th>
                            <th>Portion</th>
                            <th>Stock</th>
                            <th>Par</th>
                          </tr>
                        </thead>
                        <tbody>
                          {status.ingredientDetails.map((detail) => (
                            <tr
                              key={detail.name}
                              className={
                                detail.isMissing || detail.isBelowPar
                                  ? 'mini-row-alert'
                                  : 'mini-row-ok'
                              }
                            >
                              <td>{detail.name}</td>
                              <td>
                                {detail.requiredQty} {detail.requiredUnit}
                              </td>
                              <td>
                                {detail.isMissing ? (
                                  <span className="text-danger font-semibold">Missing</span>
                                ) : (
                                  `${formatQuantity(detail.stockQty)} ${detail.stockUnit}`
                                )}
                              </td>
                              <td>
                                {detail.isMissing
                                  ? '-'
                                  : `${formatQuantity(detail.par)} ${detail.stockUnit}`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="dish-card-actions">
                  <button
                    className={`btn btn-order ${status.isAvailable ? 'btn-order-active' : 'btn-order-disabled'}`}
                    disabled={!status.isAvailable}
                    onClick={() => onOrderDish(recipe)}
                    id={`order-btn-${recipe.dish.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <ShoppingBag size={16} />
                    {status.isAvailable ? 'Order 1 Portion' : 'Out of Stock / Below Par'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
