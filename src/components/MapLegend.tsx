import React from 'react';
import { MapMetric } from '../types/mapTypes';
import { Palette } from 'lucide-react';

interface MapLegendProps {
  currentMetric: MapMetric;
  minValue: number;
  maxValue: number;
}

export const MapLegend: React.FC<MapLegendProps> = ({
  currentMetric,
  minValue,
  maxValue
}) => {
  const getColorForValue = (value: number, min: number, max: number): string => {
    const ratio = (value - min) / (max - min);
    
    // Gradient vert (faible) vers rouge (élevé)
    if (ratio < 0.25) {
      // Vert foncé à vert clair
      const intensity = ratio / 0.25;
      return `rgb(${Math.round(22 + 56 * intensity)}, ${Math.round(163 + 34 * intensity)}, ${Math.round(74 + 20 * intensity)})`;
    } else if (ratio < 0.5) {
      // Vert clair à jaune
      const intensity = (ratio - 0.25) / 0.25;
      return `rgb(${Math.round(78 + 177 * intensity)}, ${Math.round(197 + 58 * intensity)}, ${Math.round(94 - 94 * intensity)})`;
    } else if (ratio < 0.75) {
      // Jaune à orange
      const intensity = (ratio - 0.5) / 0.25;
      return `rgb(${Math.round(255)}, ${Math.round(255 - 90 * intensity)}, ${Math.round(0)})`;
    } else {
      // Orange à rouge
      const intensity = (ratio - 0.75) / 0.25;
      return `rgb(${Math.round(255)}, ${Math.round(165 - 165 * intensity)}, ${Math.round(0)})`;
    }
  };

  const generateGradientStops = () => {
    const stops = [];
    for (let i = 0; i <= 4; i++) {
      const ratio = i / 4;
      const value = minValue + (maxValue - minValue) * ratio;
      stops.push({
        value,
        color: getColorForValue(value, minValue, maxValue)
      });
    }
    return stops;
  };

  const gradientStops = generateGradientStops();

  return (
    <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 max-w-xs">
      <div className="flex items-center gap-2 mb-3">
        <Palette className="w-4 h-4 text-blue-600" />
        <h4 className="text-sm font-semibold text-gray-800">{currentMetric.label}</h4>
      </div>

      {/* Color Scale */}
      <div className="mb-3">
        <div 
          className="h-4 rounded-md mb-2"
          style={{
            background: `linear-gradient(to right, 
              rgb(22, 163, 74) 0%, 
              rgb(78, 197, 94) 25%, 
              rgb(255, 255, 0) 50%, 
              rgb(255, 165, 0) 75%, 
              rgb(255, 0, 0) 100%)`
          }}
        />
        <div className="flex justify-between text-xs text-gray-600">
          <span>Faible</span>
          <span>Élevé</span>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{currentMetric.format(minValue)}</span>
          <span>{currentMetric.format(maxValue)}</span>
        </div>
      </div>

      {/* Value Examples */}
      <div className="grid grid-cols-5 gap-1 text-xs">
        {gradientStops.map((stop, index) => (
          <div key={index} className="text-center">
            <div 
              className="w-full h-2 rounded mb-1"
              style={{ backgroundColor: stop.color }}
            />
            <span className="text-gray-500 text-[10px]">
              {currentMetric.format(stop.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};