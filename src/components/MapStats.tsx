import React from 'react';
import { Users, Building2, BarChart, Home, Target, MapPin, Globe, Anchor } from 'lucide-react';

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
    const totalPopulation = features.reduce((sum, f) => sum + (f.properties?.population || 0), 0);
    const totalSuperficie = features.reduce((sum, f) => sum + (f.properties?.superficie || 0), 0);

    // Calculer les statistiques DOM-TOM si applicable
    const domtomFeatures = features.filter(f => 
      ['971', '972', '973', '974', '976'].includes(f.properties?.code) ||
      ['Guadeloupe', 'Martinique', 'Guyane', 'La Réunion', 'Mayotte'].includes(f.properties?.nom)
    );
    
    const domtomVacants = domtomFeatures.reduce((sum, f) => sum + (f.properties?.pp_vacant_plus_2ans_25 || 0), 0);
    const domtomPopulation = domtomFeatures.reduce((sum, f) => sum + (f.properties?.population || 0), 0);

    return { 
      totalVacants, 
      avgTauxVacance, 
      totalPopulation, 
      totalSuperficie,
      domtomVacants,
      domtomPopulation,
      hasDOMTOM: domtomFeatures.length > 0
    };
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString('fr-FR');
  };

  const globalStats = calculateStats();
  const properties = selectedFeature?.properties;
  const isDOMTOM = selectedFeature && (
    ['971', '972', '973', '974', '976'].includes(properties?.code) ||
    ['Guadeloupe', 'Martinique', 'Guyane', 'La Réunion', 'Mayotte'].includes(properties?.nom)
  );

  const getStatsForLevel = () => {
    if (selectedFeature && properties) {
      // Statistiques pour un territoire sélectionné
      const baseStats = [
        {
          icon: Home,
          label: 'Logements vacants +2ans',
          value: formatNumber(properties.pp_vacant_plus_2ans_25 || 0),
          color: 'text-red-600',
          bgColor: 'bg-red-50'
        }
      ];

      // Ajouter des stats spécifiques selon le niveau
      if (zoomLevel === 'france') {
        baseStats.push(
          {
            icon: MapPin,
            label: 'Régions',
            value: formatNumber(properties.regions || 0),
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
          },
          {
            icon: Building2,
            label: 'Départements',
            value: formatNumber(properties.departements || 0),
            color: 'text-green-600',
            bgColor: 'bg-green-50'
          },
          {
            icon: Globe,
            label: 'Communes',
            value: formatNumber(properties.communes || 0),
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
          }
        );

        // Ajouter les statistiques DOM-TOM pour la France
        if (properties.vacanceDOMTOM) {
          baseStats.push({
            icon: Anchor,
            label: 'Logements vacants DOM-TOM',
            value: formatNumber(properties.vacanceDOMTOM),
            color: 'text-orange-600',
            bgColor: 'bg-orange-50'
          });
        }
      } else {
        baseStats.push(
          {
            icon: Users,
            label: 'Population',
            value: formatNumber(properties.population || 0),
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
          },
          {
            icon: Target,
            label: 'Densité',
            value: `${formatNumber(properties.densite || 0)} hab./km²`,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
          }
        );
      }

      return baseStats;
    } else if (globalStats) {
      // Statistiques globales
      const baseStats = [
        {
          icon: Home,
          label: `Total logements vacants`,
          value: formatNumber(globalStats.totalVacants),
          color: 'text-red-600',
          bgColor: 'bg-red-50'
        }
      ];

      if (zoomLevel !== 'france') {
        baseStats.push(
          {
            icon: Users,
            label: 'Population totale',
            value: formatNumber(globalStats.totalPopulation),
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
          },
          {
            icon: Target,
            label: 'Taux moyen',
            value: `${Math.round(globalStats.avgTauxVacance)}‰`,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
          }
        );

        // Ajouter les stats DOM-TOM si présentes
        if (globalStats.hasDOMTOM && globalStats.domtomVacants > 0) {
          baseStats.push({
            icon: Anchor,
            label: 'Vacance DOM-TOM',
            value: formatNumber(globalStats.domtomVacants),
            color: 'text-orange-600',
            bgColor: 'bg-orange-50'
          });
        }
      }

      return baseStats;
    }

    return [];
  };

  const stats = getStatsForLevel();

  const getTitle = () => {
    if (selectedFeature?.properties?.nom) {
      const name = selectedFeature.properties.nom;
      if (isDOMTOM) {
        return `${name} (DOM-TOM)`;
      }
      return name;
    }
    
    switch (zoomLevel) {
      case 'france': return 'France entière (métropole + outre-mer)';
      case 'regions': return 'Vue régions';
      case 'departements': return 'Vue départements';
      case 'communes': return 'Vue communes';
      default: return 'Statistiques';
    }
  };

  const getTerritoryCount = () => {
    if (!globalStats) return '';
    
    const domtomSuffix = globalStats.hasDOMTOM ? ' (incluant DOM-TOM)' : '';
    
    switch (zoomLevel) {
      case 'france': return '1 territoire national';
      case 'regions': return `${features.length} régions${domtomSuffix}`;
      case 'departements': return `${features.length} départements${domtomSuffix}`;
      case 'communes': return `${features.length} communes${domtomSuffix}`;
      default: return '';
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {getTitle()}
            </h3>
            {!selectedFeature && (
              <p className="text-xs text-gray-500">
                {getTerritoryCount()}
              </p>
            )}
          </div>
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

      {/* Informations contextuelles */}
      {zoomLevel === 'france' && selectedFeature && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <p className="mb-1">
              <strong>Taux national:</strong> {properties?.tauxVacancePour1000}‰ habitants
            </p>
            <p className="mb-1">
              <strong>Densité:</strong> {formatNumber(properties?.densite || 0)} hab./km²
            </p>
            <p className="mb-1">
              <strong>Superficie:</strong> {formatNumber(properties?.superficie || 0)} km²
            </p>
            {properties?.tauxVacanceDOMTOM && (
              <p className="mb-1 text-orange-600">
                <strong>Taux DOM-TOM:</strong> {properties.tauxVacanceDOMTOM}‰ habitants
              </p>
            )}
          </div>
        </div>
      )}

      {/* Informations spécifiques DOM-TOM */}
      {isDOMTOM && selectedFeature && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-1 mb-2">
            <Anchor className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-medium text-orange-800">Territoire d'outre-mer</span>
          </div>
          <div className="text-xs text-gray-500">
            <p className="mb-1">
              <strong>Statut:</strong> Département/Région d'outre-mer français
            </p>
            {properties?.tauxVacancePour1000 && (
              <p className="mb-1">
                <strong>Taux local:</strong> {properties.tauxVacancePour1000}‰ habitants
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};