import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import { geoDataService } from '../services/geoDataService';
import { MapMetric, ViewState, ZoomLevel, MapState, GeoJSONCollection } from '../types/mapTypes';
import { MapControls } from './MapControls';
import { MapLegend } from './MapLegend';
import { RegionTooltip } from './RegionTooltip';
import { MapStats } from './MapStats';
import { ZoomControls } from './ZoomControls';
import 'maplibre-gl/dist/maplibre-gl.css';

const INITIAL_VIEW_STATE: ViewState = {
  longitude: 2.2137,
  latitude: 46.6034,
  zoom: 5.5,
  bearing: 0,
  pitch: 0
};

export const FranceMap: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
  const [mapState, setMapState] = useState<MapState>({
    zoomLevel: 'regions',
    selectedRegion: null,
    selectedDepartement: null,
    selectedCommune: null
  });
  
  const [geoData, setGeoData] = useState<GeoJSONCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [hoveredFeature, setHoveredFeature] = useState<any | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<any | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showLabels, setShowLabels] = useState(true);
  const [opacity, setOpacity] = useState(0.7);
  const [currentMetric, setCurrentMetric] = useState<MapMetric>({
    key: 'pp_vacant_plus_2ans_25',
    label: 'Logements vacants +2 ans',
    unit: 'logements',
    format: (value: number) => value.toLocaleString('fr-FR')
  });

  const availableMetrics: MapMetric[] = [
    {
      key: 'pp_vacant_plus_2ans_25',
      label: 'Logements vacants +2 ans',
      unit: 'logements',
      format: (value: number) => value.toLocaleString('fr-FR')
    },
    {
      key: 'tauxVacancePour1000',
      label: 'Taux de vacance',
      unit: '‰ hab.',
      format: (value: number) => `${value}‰`
    },
    {
      key: 'vacanceParKm2',
      label: 'Vacance par km²',
      unit: 'logements/km²',
      format: (value: number) => `${value} logements/km²`
    }
  ];

  // Load geographic data based on current zoom level
  useEffect(() => {
    const loadGeoData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let data: GeoJSONCollection;
        
        switch (mapState.zoomLevel) {
          case 'regions':
            data = await geoDataService.getRegions();
            break;
          case 'departements':
            if (mapState.selectedRegion) {
              data = await geoDataService.getDepartementsForRegion(mapState.selectedRegion);
            } else {
              data = await geoDataService.getDepartements();
            }
            break;
          case 'communes':
            if (mapState.selectedDepartement) {
              data = await geoDataService.getCommunesForDepartement(mapState.selectedDepartement);
            } else {
              data = await geoDataService.getCommunes();
            }
            break;
          default:
            data = await geoDataService.getRegions();
        }

        // Add real data to features
        const enhancedData = {
          ...data,
          features: geoDataService.generateSampleData(
            data.features, 
            mapState.zoomLevel === 'regions' ? 'region' : 
            mapState.zoomLevel === 'departements' ? 'departement' : 'commune'
          )
        };

        setGeoData(enhancedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
        console.error('Error loading geo data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadGeoData();
  }, [mapState.zoomLevel, mapState.selectedRegion, mapState.selectedDepartement]);

  // Calculate metric values for coloring
  const { minValue, maxValue, processedGeoData } = useMemo(() => {
    if (!geoData) return { minValue: 0, maxValue: 100, processedGeoData: null };

    const values = geoData.features
      .map(f => f.properties?.[currentMetric.key] || 0)
      .filter(v => v > 0);

    const min = Math.min(...values);
    const max = Math.max(...values);

    const getColorForValue = (value: number): string => {
      if (max === min) return 'rgb(34, 197, 94)'; // Vert par défaut
      const ratio = (value - min) / (max - min);
      
      // Gradient inversé : vert (faible) vers rouge (élevé)
      if (ratio < 0.25) {
        // Vert foncé à vert clair
        const intensity = ratio / 0.25;
        return `rgb(${Math.round(34 + 100 * intensity)}, ${Math.round(197 - 63 * intensity)}, ${Math.round(94 - 25 * intensity)})`;
      } else if (ratio < 0.5) {
        // Vert clair à jaune
        const intensity = (ratio - 0.25) / 0.25;
        return `rgb(${Math.round(134 + 121 * intensity)}, ${Math.round(134 + 121 * intensity)}, ${Math.round(69 + 31 * intensity)})`;
      } else if (ratio < 0.75) {
        // Jaune à orange
        const intensity = (ratio - 0.5) / 0.25;
        return `rgb(${Math.round(255)}, ${Math.round(255 - 90 * intensity)}, ${Math.round(100 - 100 * intensity)})`;
      } else {
        // Orange à rouge
        const intensity = (ratio - 0.75) / 0.25;
        return `rgb(${Math.round(255 - 35 * intensity)}, ${Math.round(165 - 96 * intensity)}, ${Math.round(0 + 69 * intensity)})`;
      }
    };

    const processed = {
      ...geoData,
      features: geoData.features.map(feature => ({
        ...feature,
        properties: {
          ...feature.properties,
          color: getColorForValue(feature.properties?.[currentMetric.key] || 0)
        }
      }))
    };

    return { minValue: min, maxValue: max, processedGeoData: processed };
  }, [geoData, currentMetric]);

  // Handle feature interactions
  const handleFeatureHover = useCallback((event: any) => {
    if (event.features && event.features.length > 0) {
      const feature = event.features[0];
      setHoveredFeature(feature);
      setTooltipPosition({ x: event.point.x, y: event.point.y });
    }
  }, []);

  const handleFeatureLeave = useCallback(() => {
    setHoveredFeature(null);
  }, []);

  const handleFeatureClick = useCallback((event: any) => {
    if (event.features && event.features.length > 0) {
      const feature = event.features[0];
      const featureCode = feature.properties?.code;
      
      if (selectedFeature?.properties?.code === featureCode) {
        setSelectedFeature(null);
        return;
      }

      setSelectedFeature(feature);

      // Handle zoom level transitions
      if (mapState.zoomLevel === 'regions') {
        setMapState(prev => ({
          ...prev,
          selectedRegion: featureCode,
          zoomLevel: 'departements'
        }));
        
        // Zoom to region bounds (simplified)
        setViewState(prev => ({
          ...prev,
          zoom: Math.min(prev.zoom + 1.5, 8)
        }));
      } else if (mapState.zoomLevel === 'departements') {
        setMapState(prev => ({
          ...prev,
          selectedDepartement: featureCode,
          zoomLevel: 'communes'
        }));
        
        setViewState(prev => ({
          ...prev,
          zoom: Math.min(prev.zoom + 2, 10)
        }));
      }
    }
  }, [selectedFeature, mapState.zoomLevel]);

  // Navigation functions
  const handleZoomLevelChange = useCallback((level: ZoomLevel) => {
    setMapState(prev => {
      const newState = { ...prev, zoomLevel: level };
      
      if (level === 'regions') {
        newState.selectedRegion = null;
        newState.selectedDepartement = null;
        newState.selectedCommune = null;
        setViewState(INITIAL_VIEW_STATE);
      } else if (level === 'departements') {
        newState.selectedDepartement = null;
        newState.selectedCommune = null;
      }
      
      return newState;
    });
    setSelectedFeature(null);
  }, []);

  const handleNavigateUp = useCallback(() => {
    if (mapState.zoomLevel === 'communes') {
      handleZoomLevelChange('departements');
    } else if (mapState.zoomLevel === 'departements') {
      handleZoomLevelChange('regions');
    }
  }, [mapState.zoomLevel, handleZoomLevelChange]);

  // Get current region/departement names for breadcrumb
  const getCurrentNames = () => {
    let regionName = '';
    let departementName = '';
    
    if (mapState.selectedRegion && geoData) {
      // Find region name from previous data or current selection
      regionName = selectedFeature?.properties?.nom || '';
    }
    
    if (mapState.selectedDepartement && geoData) {
      departementName = selectedFeature?.properties?.nom || '';
    }
    
    return { regionName, departementName };
  };

  const { regionName, departementName } = getCurrentNames();

  // Map layers configuration
  const fillLayer = {
    id: 'geo-fill',
    type: 'fill' as const,
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': opacity
    }
  };

  const strokeLayer = {
    id: 'geo-stroke',
    type: 'line' as const,
    paint: {
      'line-color': '#ffffff',
      'line-width': [
        'case',
        ['==', ['get', 'code'], selectedFeature?.properties?.code || ''],
        3,
        1
      ],
      'line-opacity': 0.8
    }
  };

  const highlightLayer = {
    id: 'geo-highlight',
    type: 'line' as const,
    paint: {
      'line-color': '#2563eb',
      'line-width': 4,
      'line-opacity': [
        'case',
        ['==', ['get', 'code'], selectedFeature?.properties?.code || ''],
        1,
        0
      ]
    }
  };

  // Labels GeoJSON (centroids)
  const labelsGeoJSON = useMemo(() => {
    if (!processedGeoData) return null;

    return {
      type: 'FeatureCollection' as const,
      features: processedGeoData.features.map(feature => {
        // Simple centroid calculation for polygons
        const coords = feature.geometry.coordinates[0];
        const centroid = coords.reduce(
          (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]],
          [0, 0]
        ).map(sum => sum / coords.length);

        return {
          type: 'Feature' as const,
          properties: {
            code: feature.properties.code,
            nom: feature.properties.nom
          },
          geometry: {
            type: 'Point' as const,
            coordinates: centroid
          }
        };
      })
    };
  }, [processedGeoData]);

  const labelLayer = {
    id: 'geo-labels',
    type: 'symbol' as const,
    layout: {
      'text-field': ['get', 'nom'],
      'text-font': ['Open Sans Regular'],
      'text-size': mapState.zoomLevel === 'communes' ? 10 : mapState.zoomLevel === 'departements' ? 11 : 12,
      'text-anchor': 'center',
      'text-offset': [0, 0]
    },
    paint: {
      'text-color': '#374151',
      'text-halo-color': '#ffffff',
      'text-halo-width': 2,
      'text-opacity': showLabels ? 1 : 0
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Chargement des données géographiques...
            {mapState.zoomLevel === 'departements' && ' (départements)'}
            {mapState.zoomLevel === 'communes' && ' (communes)'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <p className="text-red-600 mb-4">Erreur: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Recharger
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-1">
              Carte des Logements Vacants en France
            </h1>
            <p className="text-sm text-gray-600">
              Logements vacants de plus de 2 ans par {mapState.zoomLevel === 'regions' ? 'région' : mapState.zoomLevel === 'departements' ? 'département' : 'commune'} (2025) • Cliquez pour naviguer entre les niveaux
            </p>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-screen pt-20">
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          style={{ width: '100%', height: '100%' }}
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          interactiveLayerIds={['geo-fill']}
          onMouseMove={handleFeatureHover}
          onMouseLeave={handleFeatureLeave}
          onClick={handleFeatureClick}
          cursor="pointer"
        >
          {/* Geographic Data Source and Layers */}
          {processedGeoData && (
            <Source id="geo-data" type="geojson" data={processedGeoData}>
              <Layer {...fillLayer} />
              <Layer {...strokeLayer} />
              <Layer {...highlightLayer} />
            </Source>
          )}

          {/* Labels Source and Layer */}
          {labelsGeoJSON && (
            <Source id="labels" type="geojson" data={labelsGeoJSON}>
              <Layer {...labelLayer} />
            </Source>
          )}
        </Map>

        {/* Zoom/Navigation Controls */}
        <ZoomControls
          mapState={mapState}
          onZoomLevelChange={handleZoomLevelChange}
          onNavigateUp={handleNavigateUp}
          regionName={regionName}
          departementName={departementName}
          communeName={selectedFeature?.properties?.nom}
        />

        {/* Map Controls */}
        <MapControls
          currentMetric={currentMetric}
          onMetricChange={setCurrentMetric}
          availableMetrics={availableMetrics}
          showLabels={showLabels}
          onToggleLabels={() => setShowLabels(!showLabels)}
          opacity={opacity}
          onOpacityChange={setOpacity}
        />

        {/* Legend */}
        <MapLegend
          currentMetric={currentMetric}
          minValue={minValue}
          maxValue={maxValue}
        />

        {/* Stats Panel */}
        <MapStats
          features={processedGeoData?.features || []}
          selectedFeature={selectedFeature}
          onFeatureSelect={setSelectedFeature}
          zoomLevel={mapState.zoomLevel}
        />

        {/* Tooltip */}
        <RegionTooltip
          feature={hoveredFeature}
          x={tooltipPosition.x}
          y={tooltipPosition.y}
          visible={!!hoveredFeature}
        />
      </div>
    </div>
  );
};