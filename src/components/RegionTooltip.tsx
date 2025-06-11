import React from 'react';
import { Users, Building2, Home, Target } from 'lucide-react';

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

  const stats = [
    {
      icon: Home,
      label: 'Logements vacants +2ans',
      value: formatNumber(properties.pp_vacant_plus_2ans_25),
      color: 'text-red-600'
    }
  ];

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