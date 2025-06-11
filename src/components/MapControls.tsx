import React from 'react';
import { Layers } from 'lucide-react';

interface MapControlsProps {
  showLabels: boolean;
  onToggleLabels: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  showLabels,
  onToggleLabels
}) => {
  return (
    <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-xs">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-800">Options d'affichage</h3>
      </div>

      {/* Layer Controls */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={onToggleLabels}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-gray-700">Afficher les noms</span>
        </label>
      </div>
    </div>
  );
};