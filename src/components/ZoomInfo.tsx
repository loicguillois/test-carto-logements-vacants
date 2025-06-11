import React from 'react';
import { ZoomIn, ZoomOut, Home, Info } from 'lucide-react';

interface ZoomInfoProps {
  currentZoom: number;
  visibleLayers: {
    showFrance: boolean;
    showRegions: boolean;
    showDepartements: boolean;
    showCommunes: boolean;
    showLabels: boolean;
  };
  onResetView: () => void;
}

export const ZoomInfo: React.FC<ZoomInfoProps> = ({
  currentZoom,
  visibleLayers,
  onResetView
}) => {
  const getCurrentLevel = () => {
    if (visibleLayers.showCommunes) return 'Communes';
    if (visibleLayers.showDepartements) return 'Départements';
    if (visibleLayers.showRegions) return 'Régions';
    return 'France entière';
  };

  const getZoomInstructions = () => {
    if (visibleLayers.showCommunes) {
      return 'Niveau de détail maximum atteint';
    }
    if (visibleLayers.showDepartements) {
      return 'Zoomez pour voir les communes';
    }
    if (visibleLayers.showRegions) {
      return 'Zoomez pour voir les départements';
    }
    return 'Zoomez pour voir les régions';
  };

  const getDataDescription = () => {
    if (visibleLayers.showCommunes) {
      return 'Données détaillées par commune';
    }
    if (visibleLayers.showDepartements) {
      return 'Données agrégées par département';
    }
    if (visibleLayers.showRegions) {
      return 'Données agrégées par région';
    }
    return 'Données nationales agrégées';
  };

  return (
    <div className="absolute top-24 left-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-center gap-2 mb-4">
        <Info className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-800">Navigation par zoom</h3>
      </div>

      {/* Niveau actuel */}
      <div className="mb-4">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          Niveau actuel
        </div>
        <div className="text-lg font-medium text-gray-800 mb-1">
          {getCurrentLevel()}
        </div>
        <div className="text-sm text-gray-600 mb-1">
          Zoom: {currentZoom.toFixed(1)}x
        </div>
        <div className="text-xs text-gray-500">
          {getDataDescription()}
        </div>
      </div>

      {/* Indicateur de zoom */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <ZoomOut className="w-4 h-4 text-gray-400" />
          <div className="flex-1 h-3 bg-gray-200 rounded-full relative">
            {/* Seuils de zoom */}
            <div className="absolute left-0 top-0 w-1 h-full bg-blue-600 rounded-l-full" title="France" />
            <div className="absolute left-1/4 top-0 w-1 h-full bg-green-500" title="Régions" />
            <div className="absolute left-2/4 top-0 w-1 h-full bg-yellow-500" title="Départements" />
            <div className="absolute left-3/4 top-0 w-1 h-full bg-purple-500" title="Communes" />
            
            {/* Position actuelle */}
            <div 
              className="absolute top-0 w-3 h-3 bg-red-500 rounded-full transform -translate-x-1/2 border-2 border-white shadow-md"
              style={{ 
                left: `${Math.min(Math.max((currentZoom - 3) / 9 * 100, 0), 100)}%` 
              }}
            />
          </div>
          <ZoomIn className="w-4 h-4 text-gray-400" />
        </div>
        
        {/* Légende des seuils */}
        <div className="grid grid-cols-4 gap-1 text-xs text-gray-500">
          <span className="text-center">France</span>
          <span className="text-center">Régions</span>
          <span className="text-center">Départements</span>
          <span className="text-center">Communes</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          {getZoomInstructions()}
        </p>
      </div>

      {/* Statistiques du niveau actuel */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          Niveau de données
        </div>
        <div className="text-sm text-gray-700">
          {visibleLayers.showFrance && '1 territoire national'}
          {visibleLayers.showRegions && '18 régions françaises'}
          {visibleLayers.showDepartements && '101 départements'}
          {visibleLayers.showCommunes && '~35 000 communes'}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="space-y-2">
        <button
          onClick={onResetView}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          <Home className="w-4 h-4" />
          Vue d'ensemble France
        </button>
      </div>

      {/* Conseils d'utilisation */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Utilisez la molette pour zoomer/dézoomer</p>
          <p>• Cliquez sur un territoire pour le centrer</p>
          <p>• Les données s'agrègent automatiquement</p>
          <p>• 4 niveaux : France → Régions → Départements → Communes</p>
        </div>
      </div>
    </div>
  );
};