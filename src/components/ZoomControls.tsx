import React from 'react';
import { ZoomLevel, MapState } from '../types/mapTypes';
import { Map, MapPin, Building, ChevronRight, Home } from 'lucide-react';

interface ZoomControlsProps {
  mapState: MapState;
  onZoomLevelChange: (level: ZoomLevel) => void;
  onNavigateUp: () => void;
  regionName?: string;
  departementName?: string;
  communeName?: string;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  mapState,
  onZoomLevelChange,
  onNavigateUp,
  regionName,
  departementName,
  communeName
}) => {
  const getBreadcrumb = () => {
    const items = [
      { level: 'regions' as ZoomLevel, name: 'France', icon: Map }
    ];

    if (mapState.selectedRegion && regionName) {
      items.push({ level: 'departements' as ZoomLevel, name: regionName, icon: MapPin });
    }

    if (mapState.selectedDepartement && departementName) {
      items.push({ level: 'communes' as ZoomLevel, name: departementName, icon: Building });
    }

    if (mapState.selectedCommune && communeName) {
      items.push({ level: 'communes' as ZoomLevel, name: communeName, icon: Home });
    }

    return items;
  };

  const breadcrumb = getBreadcrumb();

  return (
    <div className="absolute top-24 left-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-md">
      <div className="flex items-center gap-2 mb-4">
        <Map className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-800">Navigation</h3>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        {breadcrumb.map((item, index) => {
          const Icon = item.icon;
          const isLast = index === breadcrumb.length - 1;
          const isClickable = !isLast;

          return (
            <React.Fragment key={index}>
              <button
                onClick={() => isClickable && onZoomLevelChange(item.level)}
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                  isClickable 
                    ? 'hover:bg-blue-50 text-blue-600 cursor-pointer' 
                    : 'text-gray-800 font-medium'
                }`}
                disabled={!isClickable}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </button>
              {!isLast && <ChevronRight className="w-4 h-4 text-gray-400" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        {mapState.zoomLevel !== 'regions' && (
          <button
            onClick={onNavigateUp}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Niveau supérieur
          </button>
        )}

        <button
          onClick={() => onZoomLevelChange('regions')}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
        >
          <Home className="w-4 h-4" />
          Retour à la France
        </button>
      </div>

      {/* Current Level Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
          Niveau actuel
        </div>
        <div className="text-sm font-medium text-gray-800">
          {mapState.zoomLevel === 'regions' && 'Régions de France'}
          {mapState.zoomLevel === 'departements' && `Départements${regionName ? ` - ${regionName}` : ''}`}
          {mapState.zoomLevel === 'communes' && `Communes${departementName ? ` - ${departementName}` : ''}`}
        </div>
        
        {/* Instructions */}
        <div className="text-xs text-gray-500 mt-2">
          {mapState.zoomLevel === 'regions' && 'Cliquez sur une région pour voir ses départements'}
          {mapState.zoomLevel === 'departements' && 'Cliquez sur un département pour voir ses communes'}
          {mapState.zoomLevel === 'communes' && 'Niveau de détail maximum atteint'}
        </div>
      </div>
    </div>
  );
};