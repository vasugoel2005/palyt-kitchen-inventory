import React from 'react';
import type { DeleteCheckResult } from '../types';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredientName: string;
  checkResult: DeleteCheckResult;
  onConfirmDelete: (name: string) => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  ingredientName,
  checkResult,
  onConfirmDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            {checkResult.canDelete ? (
              <AlertTriangle className="icon-warning" size={20} />
            ) : (
              <ShieldAlert className="icon-danger" size={20} />
            )}
            <h3>
              {checkResult.canDelete
                ? `Delete Ingredient: ${ingredientName}`
                : `Cannot Delete "${ingredientName}"`}
            </h3>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {checkResult.canDelete ? (
            <div>
              <p>
                Are you sure you want to delete <strong>{ingredientName}</strong> from kitchen stock?
              </p>
              <p className="subtext">
                This ingredient is not used by any active recipes (e.g. Bay Leaves, Saffron) and can be safely removed.
              </p>
            </div>
          ) : (
            <div className="blocked-delete-box">
              <p className="error-message">
                <strong>{checkResult.reason}</strong>
              </p>
              <p className="subtext">
                To protect recipe integrity and menu availability calculations, ingredients linked to recipes cannot be deleted from stock.
              </p>
              {checkResult.referencedRecipes && (
                <div className="referencing-dishes">
                  <span className="label">Used in recipes:</span>
                  <ul>
                    {checkResult.referencedRecipes.map((dish) => (
                      <li key={dish}>
                        <span className="dish-tag">{dish}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {checkResult.canDelete ? 'Cancel' : 'Understood'}
          </button>
          {checkResult.canDelete && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => {
                onConfirmDelete(ingredientName);
                onClose();
              }}
            >
              <Trash2 size={16} /> Delete Ingredient
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
