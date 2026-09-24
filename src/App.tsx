import { useState, useMemo } from 'react';
import initialStockData from './data/stock.json';
import initialRecipesData from './data/recipes.json';
import type { IngredientStock, Recipe, DeleteCheckResult } from './types';
import {
  orderDish,
  calculateMenuAvailability,
} from './logic/inventoryLogic';
import { formatQuantity } from './logic/unitConversion';
import { Header } from './components/Header';
import { StockTable } from './components/StockTable';
import { MenuGrid } from './components/MenuGrid';
import { AddIngredientModal } from './components/AddIngredientModal';
import { EditIngredientModal } from './components/EditIngredientModal';
import { DeleteConfirmationModal } from './components/DeleteConfirmationModal';
import { NotificationBanner, type NotificationMessage } from './components/NotificationBanner';
import './App.css';

export function App() {
  const [stock, setStock] = useState<IngredientStock[]>(() => {
    return JSON.parse(JSON.stringify(initialStockData));
  });

  const [recipes] = useState<Recipe[]>(() => {
    return JSON.parse(JSON.stringify(initialRecipesData));
  });

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IngredientStock | null>(null);
  const [deletingItemName, setDeletingItemName] = useState<string | null>(null);
  const [deleteCheck, setDeleteCheck] = useState<DeleteCheckResult | null>(null);

  // Notification state
  const [notification, setNotification] = useState<NotificationMessage | null>(null);
  const [lastOrderedDish, setLastOrderedDish] = useState<string | null>(null);

  const menuAvailability = useMemo(() => {
    return calculateMenuAvailability(recipes, stock);
  }, [recipes, stock]);

  const availableDishesCount = useMemo(() => {
    return menuAvailability.filter((d) => d.isAvailable).length;
  }, [menuAvailability]);

  // Handle Order
  const handleOrderDish = (recipe: Recipe) => {
    // Record dishes available before order
    const beforeAvailability = calculateMenuAvailability(recipes, stock);
    const beforeAvailableDishes = new Set(
      beforeAvailability.filter((d) => d.isAvailable).map((d) => d.dish)
    );

    const orderResult = orderDish(recipe, stock);

    if (!orderResult.success || !orderResult.updatedStock) {
      setNotification({
        id: Date.now().toString(),
        type: 'warning',
        title: `Could not order "${recipe.dish}"`,
        details: [orderResult.message],
      });
      return;
    }

    // Apply new stock
    const newStock = orderResult.updatedStock;
    setStock(newStock);
    setLastOrderedDish(recipe.dish);

    // Compute dishes that became unavailable after order
    const afterAvailability = calculateMenuAvailability(recipes, newStock);
    const becameUnavailable = afterAvailability
      .filter((d) => !d.isAvailable && beforeAvailableDishes.has(d.dish))
      .map((d) => d.dish);

    const details: string[] = [];
    if (orderResult.deductions) {
      const deductionSummary = orderResult.deductions
        .map(
          (d) =>
            `${d.ingredient}: -${formatQuantity(d.deductedQty)} ${d.unit} (Remaining: ${formatQuantity(d.remainingQty)} ${d.unit})`
        )
        .join(', ');
      details.push(`Deducted: ${deductionSummary}`);
    }

    if (becameUnavailable.length > 0) {
      details.push(
        `⚠️ Immediate Menu Impact: [${becameUnavailable.join(', ')}] fell below par and is now UNAVAILABLE.`
      );
    }

    setNotification({
      id: Date.now().toString(),
      type: becameUnavailable.length > 0 ? 'warning' : 'success',
      title: `Order Placed: 1x ${recipe.dish}`,
      details,
    });
  };

  // Handle Add Ingredient
  const handleAddIngredient = (newIngredient: IngredientStock) => {
    setStock((prev) => [...prev, newIngredient]);
    setNotification({
      id: Date.now().toString(),
      type: 'success',
      title: `Added "${newIngredient.name}" to stock (${formatQuantity(newIngredient.qty)} ${newIngredient.unit}, Par: ${formatQuantity(newIngredient.par)} ${newIngredient.unit})`,
    });
  };

  // Handle Edit Ingredient
  const handleSaveEdit = (originalName: string, updated: IngredientStock) => {
    setStock((prev) =>
      prev.map((item) =>
        item.name.toLowerCase() === originalName.toLowerCase() ? updated : item
      )
    );
    setNotification({
      id: Date.now().toString(),
      type: 'info',
      title: `Updated "${updated.name}" (Stock: ${formatQuantity(updated.qty)} ${updated.unit}, Par: ${formatQuantity(updated.par)} ${updated.unit})`,
    });
  };

  // Handle Delete Request
  const handleDeleteRequest = (name: string, checkResult: DeleteCheckResult) => {
    setDeletingItemName(name);
    setDeleteCheck(checkResult);
  };

  // Handle Confirm Delete
  const handleConfirmDelete = (name: string) => {
    setStock((prev) => prev.filter((item) => item.name.toLowerCase() !== name.toLowerCase()));
    setNotification({
      id: Date.now().toString(),
      type: 'info',
      title: `Deleted "${name}" from stock.`,
    });
    setDeletingItemName(null);
    setDeleteCheck(null);
  };

  // Handle Quick Restock
  const handleQuickRestock = (name: string, amount: number) => {
    setStock((prev) =>
      prev.map((item) => {
        if (item.name.toLowerCase() === name.toLowerCase()) {
          const newQty = Math.round((item.qty + amount) * 10000) / 10000;
          return { ...item, qty: newQty };
        }
        return item;
      })
    );
    setNotification({
      id: Date.now().toString(),
      type: 'success',
      title: `Restocked ${name}: +${formatQuantity(amount)} added.`,
    });
  };

  // Reset to initial JSON data
  const handleResetData = () => {
    setStock(JSON.parse(JSON.stringify(initialStockData)));
    setNotification({
      id: Date.now().toString(),
      type: 'info',
      title: 'Kitchen stock reset to initial stock.json data.',
    });
  };

  return (
    <div className="app-container">
      <Header
        onResetData={handleResetData}
        availableCount={availableDishesCount}
        totalDishes={recipes.length}
      />

      <div className="main-content">
        <NotificationBanner
          notification={notification}
          onDismiss={() => setNotification(null)}
        />

        {/* Side-by-side layout: Left is Stock Management, Right is Live Diner Menu */}
        <div className="dashboard-grid">
          <div className="dashboard-column left-column">
            <StockTable
              stock={stock}
              recipes={recipes}
              onAddClick={() => setIsAddOpen(true)}
              onEditClick={(item) => setEditingItem(item)}
              onDeleteClick={handleDeleteRequest}
              onQuickRestock={handleQuickRestock}
            />
          </div>

          <div className="dashboard-column right-column">
            <MenuGrid
              recipes={recipes}
              stock={stock}
              onOrderDish={handleOrderDish}
              lastOrderedDish={lastOrderedDish}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddIngredientModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAddIngredient}
        existingStock={stock}
      />

      <EditIngredientModal
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        ingredient={editingItem}
        onSave={handleSaveEdit}
        existingStock={stock}
      />

      {deletingItemName && deleteCheck && (
        <DeleteConfirmationModal
          isOpen={true}
          onClose={() => {
            setDeletingItemName(null);
            setDeleteCheck(null);
          }}
          ingredientName={deletingItemName}
          checkResult={deleteCheck}
          onConfirmDelete={handleConfirmDelete}
        />
      )}
    </div>
  );
}

export default App;
