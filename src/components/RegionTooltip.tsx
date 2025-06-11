import React from 'react';
import { Users, Building2, Home, Target, MapPin, Globe, Anchor } from 'lucide-react';

interface RegionTooltipProps {
  feature: any | null;
  x: number;
  y: number;
  visible: boolean;
}

export const RegionTooltip: React.FC<RegionTooltipProps> = ({
  feature,
  x,
  y,
  visible
}) => {
  if (!visible || !feature) return null;

  const formatNumber = (num: number): string => {
    return num?.toLocaleString('fr-FR') || 'N/A';
  };

  const properties = feature.properties || {};
  const isFranceLevel = properties.code === 'FR';
  const isDOMTOM = ['971', '972', '973', '974', '976'].includes(properties.code) || 
                   ['Guadeloupe', 'Martinique', 'Guyane', 'La Réunion', 'Mayotte'].includes(properties.nom);
  const isRegionDepartement = properties.isRegionDepartement || isDOMTOM;

  const getStats = () => {
    const baseStats = [
      {
        icon: Home,
        label: 'Logements vacants +2ans',
        value: formatNumber(properties.pp_vacant_plus_2ans_25),
        color: 'text-red-600'
      }
    ];

    if (isFranceLevel) {
      // Statistiques spéciales pour le niveau France
      baseStats.push(
        {
          icon: MapPin,
          label: 'Régions',
          value: formatNumber(properties.regions),
          color: 'text-blue-600'
        },
        {
          icon: Building2,
          label: 'Départements',
          value: formatNumber(properties.departements),
          color: 'text-green-600'
        },
        {
          icon: Globe,
          label: 'Communes',
          value: formatNumber(properties.communes),
          color: 'text-purple-600'
        }
      );

      // Ajouter les statistiques DOM-TOM
      if (properties.vacanceDOMTOM) {
        baseStats.push({
          icon: Anchor,
          label: 'Vacance DOM-TOM',
          value: formatNumber(properties.vacanceDOMTOM),
          color: 'text-orange-600'
        });
      }
    } else {
      // Statistiques classiques pour les autres niveaux
      if (properties.population) {
        baseStats.push({
          icon: Users,
          label: 'Population',
          value: formatNumber(properties.population),
          color: 'text-blue-600'
        });
      }

      if (properties.densite) {
        baseStats.push({
          icon: Target,
          label: 'Densité',
          value: `${formatNumber(properties.densite)} hab./km²`,
          color: 'text-green-600'
        });
      }
    }

    return baseStats;
  };

  const stats = getStats();

  return (
    <div
      className="absolute z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-xs pointer-events-none transition-opacity duration-200"
      style={{
        left: x + 10,
        top: y - 10,
        transform: 'translateY(-100%)'
      }}
    >
      <h3 className="font-semibold text-gray-800 mb-3 text-base">
        {properties.nom || 'Territoire'}
      </h3>
      
      {/* Indicateur de niveau */}
      {isFranceLevel && (
        <div className="mb-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full inline-block">
          Niveau national (métropole + outre-mer)
        </div>
      )}

      {/* Indicateur DOM-TOM avec statut région-département */}
      {isDOMTOM && (
        <div className="mb-3 space-y-1">
          <div className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full inline-block flex items-center gap-1">
            <Anchor className="w-3 h-3" />
            Collectivité d'outre-mer
          </div>
          {isRegionDepartement && (
            <div className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full inline-block">
              Région = Département
            </div>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="flex items-center space-x-2">
              <Icon className={`w-4 h-4 ${stat.color}`} />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Informations supplémentaires pour la France */}
      {isFranceLevel && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Taux national:</strong> {properties.tauxVacancePour1000}‰ hab.</p>
            <p><strong>Superficie:</strong> {formatNumber(properties.superficie)} km²</p>
            {properties.tauxVacanceDOMTOM && (
              <p><strong>Taux DOM-TOM:</strong> {properties.tauxVacanceDOMTOM}‰ hab.</p>
            )}
          </div>
        </div>
      )}

      {/* Informations spécifiques DOM-TOM */}
      {isDOMTOM && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            <p className="flex items-center gap-1 mb-1">
              <Anchor className="w-3 h-3" />
              Collectivité territoriale française
            </p>
            {isRegionDepartement && (
              <p className="mb-1 text-purple-600">
                <strong>Statut:</strong> Région et département confondus
              </p>
            )}
            {properties.tauxVacancePour1000 && (
              <p className="mt-1"><strong>Taux:</strong> {properties.tauxVacancePour1000}‰ hab.</p>
            )}
          </div>
        </div>
      )}
      
      {/* Small arrow pointing to the region */}
      <div 
        className="absolute w-3 h-3 bg-white border-r border-b border-gray-200 transform rotate-45"
        style={{
          bottom: '-6px',
          left: '20px'
        }}
      />
    </div>
  );
};