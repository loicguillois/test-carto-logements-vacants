import React from 'react';
import { Layers, Eye, EyeOff, Palette } from 'lucide-react';
import { MapMetric } from '../types/mapTypes';

interface MapControlsProps {
  currentMetric: MapMetric;
  onMetricChange: (metric: MapMetric) => void;
  availableMetrics: MapMetric[];
  showLabels: boolean;
  onToggleLabels: () => void;
  opacity: number;
  onOpacityChange: (opacity: number) => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  currentMetric,
  onMetricChange,
  availableMetrics,
  showLabels,
  onToggleLabels,
  opacity,
  onOpacityChange
}) => {
  return (
    <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-xs">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-800">Options d'affichage</h3>
      </div>

      {/* Sélection de métrique */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Métrique affichée
        </label>
        <select
          value={currentMetric.key}
          onChange={(e) => {
            const metric = availableMetrics.find(m => m.key === e.target.value);
            if (metric) onMetricChange(metric);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {availableMetrics.map(metric => (
            <option key={metric.key} value={metric.key}>
              {metric.label}
            </option>
          ))}
        </select>
      </div>

      {/* Contrôles d'affichage */}
      <div className="space-y-3">
        {/* Labels */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showLabels}
            onChange={onToggleLabels}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-gray-700 flex items-center gap-1">
            {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            Afficher les noms
          </span>
        </label>

        {/* Opacité */}
        <div>
          <label className="flex items-center gap-2 text-sm text-gray-700 mb-2">
            <Palette className="w-4 h-4" />
            Opacité: {Math.round(opacity * 100)}%
          </label>
          <input
            type="range"
            min="0.3"
            max="1"
            step="0.1"
            value={opacity}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      {/* Informations sur la métrique actuelle */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <div className="font-medium text-gray-700 mb-1">
            {currentMetric.label}
          </div>
          <div>
            Unité: {currentMetric.unit}
          </div>
        </div>
      </div>
    </div>
  );
};