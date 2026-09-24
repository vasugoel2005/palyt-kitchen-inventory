# Palyt — Kitchen Inventory & Menu Live Sync

A real-time kitchen inventory management system that tracks ingredient stock, enforces par-level thresholds, and derives live menu availability. When a dish is ordered, ingredient quantities are deducted and the entire menu recalculates instantly.

Built as a take-home assessment for the Software Development Intern role at Palyt.

---

## Features

- **Stock Management** — View, add, edit, search/filter, restock, and delete ingredients
- **Par-Level Tracking** — Each ingredient has a par (buffer threshold); dishes become unavailable when stock falls below par
- **Live Menu Availability** — Derived automatically from stock vs. par; no manual availability flag
- **Order Flow** — Select an available dish → deduct recipe quantities from stock → recalculate menu → UI reacts immediately
- **Restock** — Inline quick-restock or full edit; restocking above par re-enables affected dishes
- **Delete Protection** — Ingredients referenced by recipes cannot be deleted; clear explanation shown
- **Unit Conversion** — Normalizes kg↔g, l↔ml internally so stock in kg and recipe in g work correctly

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 + Vite 8 |
| Language | TypeScript |
| Styling | Plain CSS (no Tailwind) |
| Testing | Vitest 5 |
| Data | JSON files (no database) |
| Icons | lucide-react |

## Installation

```bash
git clone <repo-url>
cd Palyt
npm install
```

## How to Run

```bash
npm run dev
```

Opens at `http://localhost:5173` by default.

## How to Run Tests

```bash
npm run test          # single run
npm run test:watch    # watch mode
```

## Project Structure

```
src/
├── data/
│   ├── stock.json          # Initial ingredient stock data
│   └── recipes.json        # Recipe definitions with ingredients
├── types/
│   └── index.ts            # TypeScript interfaces
├── logic/
│   ├── unitConversion.ts   # Unit normalization utility (kg→g, l→ml)
│   ├── inventoryLogic.ts   # Core business logic (availability, ordering, deletion checks)
│   └── __tests__/
│       ├── unitConversion.test.ts
│       └── inventoryLogic.test.ts
├── components/
│   ├── Header.tsx
│   ├── StockTable.tsx
│   ├── MenuGrid.tsx
│   ├── AddIngredientModal.tsx
│   ├── EditIngredientModal.tsx
│   ├── DeleteConfirmationModal.tsx
│   └── NotificationBanner.tsx
├── App.tsx                 # Main app wiring state + handlers
├── App.css                 # All component styles
├── index.css               # CSS variables and reset
└── main.tsx                # Entry point
```

## Business Rules

### Availability

A dish is **AVAILABLE** only when **every** ingredient it requires satisfies:
1. The ingredient exists in stock.
2. Units between stock and recipe are compatible (e.g. kg and g are compatible; g and ml are not).
3. Stock quantity ≥ par level (the par buffer threshold).

If **any** ingredient fails these checks, the dish is **UNAVAILABLE**.

### Order Deduction

When an order is placed:
1. Verify dish is currently available.
2. For each recipe ingredient, convert the recipe quantity to the stock item's unit and subtract.
3. Recalculate all menu availability (shared ingredients affect multiple dishes).

### Unit Conversion Approach

Stock records how ingredients are **purchased** (e.g. Paneer = 1.4 kg).  
Recipes record how ingredients are **consumed** (e.g. Paneer = 180 g).

The conversion utility normalizes compatible units to a common base:
- **Weight**: kg, g, grams, kilograms → base unit **grams (g)**
- **Volume**: l, litre, ml, millilitres → base unit **millilitres (ml)**
- **Count**: pcs, pieces → base unit **pcs**

Incompatible categories (e.g. grams vs. millilitres) are **never** converted — the dish is marked unavailable with a clear reason.

### Delete Behavior

| Scenario | Behavior |
|---|---|
| Ingredient is **not** referenced by any recipe (e.g. Bay Leaves, Saffron) | ✅ Deletion allowed after confirmation |
| Ingredient **is** referenced by one or more recipes (e.g. Paneer, Cashews) | ❌ Deletion blocked; modal explains which recipes reference it |

**Design decision**: Silent deletion of referenced ingredients would corrupt recipe data and break availability calculations. Instead, the user sees a clear message like: *"Cannot delete Cashews because it is used by 2 recipes: Paneer Butter Masala, Shahi Paneer Korma."*

## Data Observations & Design Decisions

### Missing Ingredients in Stock

The supplied `recipes.json` references ingredients that are **not present** in `stock.json`:
- **Cumin Seeds** — required by Veg Pulao and Jeera Rice
- **Refined Flour** — required by Butter Naan

**Decision**: These dishes are correctly marked **UNAVAILABLE** with the reason "Missing from stock: [ingredient]". The missing ingredients are not silently added. The user can manually add them via the Add Ingredient form.

### Chicken at Zero Stock

Chicken has `qty: 0` in stock but `par: 1` kg. This correctly makes Chicken Biryani unavailable.

### Par Level as Buffer Threshold

The par level represents a **minimum buffer** the kitchen wants to maintain. It is not a "per-portion" threshold — it's the point below which the kitchen considers itself unable to reliably serve dishes containing that ingredient.

## Important Assumptions

1. **In-memory state only** — All changes (orders, restocks, edits) are held in React state. Refreshing the page resets to `stock.json`. A "Reset Data" button is provided for convenience.
2. **Case-insensitive matching** — Ingredient name lookups between stock and recipes are case-insensitive.
3. **Recipes are read-only** — The supplied recipes are not editable through the UI; only stock is managed.
4. **Single portion per order** — Each order deducts exactly one portion (the recipe quantities).
5. **Floating point handling** — Quantities are rounded to 4 decimal places after arithmetic to avoid IEEE 754 drift.
