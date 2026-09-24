import React from 'react';
import { ChefHat, RotateCcw } from 'lucide-react';

interface HeaderProps {
  onResetData: () => void;
  availableCount: number;
  totalDishes: number;
}

export const Header: React.FC<HeaderProps> = ({
  onResetData,
  availableCount,
  totalDishes,
}) => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-icon">
          <ChefHat size={26} />
        </div>
        <div>
          <h1 className="brand-title">Palyt Kitchen & Menu Live Sync</h1>
          <p className="brand-subtitle">
            Real-time kitchen inventory par tracking & instant menu availability
          </p>
        </div>
      </div>

      <div className="header-actions">
        <div className="live-pill">
          <span className="live-dot"></span>
          <span>
            Menu Live: <strong>{availableCount}/{totalDishes}</strong> Available
          </span>
        </div>
        <button
          className="btn btn-outline"
          onClick={onResetData}
          title="Reset stock to initial stock.json data"
        >
          <RotateCcw size={15} />
          <span>Reset Data</span>
        </button>
      </div>
    </header>
  );
};
