import React, { useState, useMemo } from 'react';
import type { IngredientStock, Recipe, DeleteCheckResult } from '../types';
import { canDeleteIngredient } from '../logic/inventoryLogic';
import { formatQuantity } from '../logic/unitConversion';
import { Search, Plus, Edit2, Trash2, PlusCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

interface StockTableProps {
  stock: IngredientStock[];
  recipes: Recipe[];
  onAddClick: () => void;
  onEditClick: (item: IngredientStock) => void;
  onDeleteClick: (name: string, checkResult: DeleteCheckResult) => void;
  onQuickRestock: (name: string, amount: number) => void;
}

export const StockTable: React.FC<StockTableProps> = ({
  stock,
  recipes,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onQuickRestock,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [restockItem, setRestockItem] = useState<string | null>(null);
  const [restockAmount, setRestockAmount] = useState<string>('');

  const filteredStock = useMemo(() => {
    if (!searchTerm.trim()) return stock;
    const term = searchTerm.toLowerCase().trim();
    return stock.filter((item) => item.name.toLowerCase().includes(term));
  }, [stock, searchTerm]);

  const handleDeleteRequest = (item: IngredientStock) => {
    const checkResult = canDeleteIngredient(item.name, recipes);
    onDeleteClick(item.name, checkResult);
  };

  const handleQuickRestockSubmit = (name: string) => {
    const amt = parseFloat(restockAmount);
    if (!isNaN(amt) && amt > 0) {
      onQuickRestock(name, amt);
      setRestockItem(null);
      setRestockAmount('');
    }
  };

  return (
    <div className="card stock-section">
      <div className="section-header">
        <div>
          <h2>Kitchen Stock</h2>
          <p className="section-subtitle">
            {stock.length} ingredients tracked &bull; {stock.filter((i) => i.qty < i.par).length} below par buffer
          </p>
        </div>
        <button className="btn btn-primary" onClick={onAddClick} id="add-ingredient-btn">
          <Plus size={16} /> Add Ingredient
        </button>
      </div>

      <div className="search-bar-container">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            id="stock-search-input"
            placeholder="Search ingredients (e.g. Paneer, Cashews)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
              title="Clear search"
            >
              &times;
            </button>
          )}
        </div>
      </div>

      <div className="table-responsive">
        <table className="stock-table" id="stock-table">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Current Stock</th>
              <th>Par Buffer</th>
              <th>Stock Health</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStock.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-table-cell">
                  {searchTerm ? `No ingredients matching "${searchTerm}"` : 'No ingredients in stock'}
                </td>
              </tr>
            ) : (
              filteredStock.map((item) => {
                const isDepleted = item.qty <= 0;
                const isBelowPar = item.qty < item.par;
                const isReferenced = recipes.some((r) =>
                  r.ingredients.some((i) => i.name.toLowerCase() === item.name.toLowerCase())
                );

                return (
                  <tr
                    key={item.name}
                    className={`stock-row ${isBelowPar ? 'row-below-par' : ''}`}
                    id={`stock-row-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <td>
                      <div className="ingredient-name-cell">
                        <strong>{item.name}</strong>
                        {!isReferenced && (
                          <span className="badge badge-neutral" title="Not used in any recipe">
                            Unused
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="quantity-display">
                        <span className={`qty-number ${isBelowPar ? 'text-warning font-bold' : ''}`}>
                          {formatQuantity(item.qty)}
                        </span>
                        <span className="unit-label">{item.unit}</span>
                      </div>
                    </td>
                    <td>
                      <div className="par-display">
                        <span>{formatQuantity(item.par)}</span>
                        <span className="unit-label">{item.unit}</span>
                      </div>
                    </td>
                    <td>
                      {isDepleted ? (
                        <span className="status-badge badge-depleted">
                          <AlertCircle size={13} /> Depleted (0)
                        </span>
                      ) : isBelowPar ? (
                        <span className="status-badge badge-warning">
                          <AlertCircle size={13} /> Below Par
                        </span>
                      ) : (
                        <span className="status-badge badge-success">
                          <CheckCircle2 size={13} /> Healthy
                        </span>
                      )}
                    </td>
                    <td className="text-right actions-cell">
                      {restockItem === item.name ? (
                        <div className="quick-restock-inline">
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            placeholder={`+${item.unit}`}
                            value={restockAmount}
                            onChange={(e) => setRestockAmount(e.target.value)}
                            className="restock-input"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleQuickRestockSubmit(item.name);
                              if (e.key === 'Escape') setRestockItem(null);
                            }}
                          />
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleQuickRestockSubmit(item.name)}
                          >
                            Add
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setRestockItem(null)}
                          >
                            &times;
                          </button>
                        </div>
                      ) : (
                        <div className="action-buttons-group">
                          <button
                            className="btn-action btn-action-restock"
                            onClick={() => {
                              setRestockItem(item.name);
                              setRestockAmount('');
                            }}
                            title={`Restock ${item.name}`}
                          >
                            <PlusCircle size={15} />
                            <span>Restock</span>
                          </button>
                          <button
                            className="btn-action btn-action-edit"
                            onClick={() => onEditClick(item)}
                            title={`Edit ${item.name}`}
                            id={`edit-btn-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            className="btn-action btn-action-delete"
                            onClick={() => handleDeleteRequest(item)}
                            title={`Delete ${item.name}`}
                            id={`delete-btn-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
