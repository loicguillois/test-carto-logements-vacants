import React from 'react';
import { Users, Building2, BarChart, Home, Target } from 'lucide-react';

interface MapStatsProps {
  features: any[];
  selectedFeature: any | null;
  onFeatureSelect: (feature: any | null) => void;
  zoomLevel: string;
}

export const MapStats: React.FC<MapStatsProps> = ({ 
  features, 
  selectedFeature, 
  onFeatureSelect,
  zoomLevel
}) => {
  const calculateStats = () => {
    if (!features.length) return null;

    const totalVacants = features.reduce((sum, f) => sum + (f.properties?.pp_vacant_plus_2ans_25 || 0), 0);
    const avgTauxVacance = features.reduce((sum, f) => sum + (f.properties?.tauxVacancePour1000 || 0), 0) / features.length;

    return { totalVacants, avgTauxVacance };
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('fr-FR');
  };

  const globalStats = calculateStats();
  const properties = selectedFeature?.properties;

  const stats = selectedFeature && properties ? [
    {
      icon: Home,
      label: 'Logements vacants +2ans',
      value: formatNumber(properties.pp_vacant_plus_2ans_25 || 0),
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ] : globalStats ? [
    {
      icon: Home,
      label: 'Total logements vacants',
      value: formatNumber(globalStats.totalVacants),
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ] : [];

  const getTitle = () => {
    if (selectedFeature?.properties?.nom) {
      return selectedFeature.properties.nom;
    }
    
    switch (zoomLevel) {
      case 'regions': return 'Vue d\'ensemble - France';
      case 'departements': return 'Vue départements';
      case 'communes': return 'Vue communes';
      default: return 'Statistiques';
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-800">
            {getTitle()}
          </h3>
        </div>
        {selectedFeature && (
          <button
            onClick={() => onFeatureSelect(null)}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Effacer
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`flex items-center space-x-3 p-3 ${stat.bgColor} rounded-lg`}>
              <Icon className={`w-5 h-5 ${stat.color}`} />
              <div>
                <p className="text-xs text-gray-600 uppercase tracking-wide font-medium">
                  {stat.label}
                </p>
                <p className="text-sm font-bold text-gray-800">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};