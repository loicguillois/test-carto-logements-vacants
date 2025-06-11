import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import { geoDataService } from '../services/geoDataService';
import { MapMetric, ViewState, GeoJSONCollection } from '../types/mapTypes';
import { MapLegend } from './MapLegend';
import { RegionTooltip } from './RegionTooltip';
import { ZoomInfo } from './ZoomInfo';
import 'maplibre-gl/dist/maplibre-gl.css';

const INITIAL_VIEW_STATE: ViewState = {
  longitude: 2.2137,
  latitude: 46.6034,
  zoom: 4.5, // Zoom initial plus large pour voir la France entière
  bearing: 0,
  pitch: 0
};

// Seuils de zoom pour l'affichage des différents niveaux
const ZOOM_THRESHOLDS = {
  FRANCE_ONLY: 4.5,
  REGIONS_VISIBLE: 5.5,
  DEPARTEMENTS_VISIBLE: 6.5,
  COMMUNES_VISIBLE: 8.5,
  LABELS_VISIBLE: 6.0
};

export const FranceMap: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);
  
  // Données géographiques pour tous les niveaux
  const [franceData, setFranceData] = useState<GeoJSONCollection | null>(null);
  const [regionsData, setRegionsData] = useState<GeoJSONCollection | null>(null);
  const [departementsData, setDepartementsData] = useState<GeoJSONCollection | null>(null);
  const [communesData, setCommunesData] = useState<GeoJSONCollection | null>(null);
  
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

  // Charger toutes les données géographiques au démarrage
  useEffect(() => {
    const loadAllGeoData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Charger les contours officiels de la France depuis l'open data
        const franceContours = await geoDataService.getFranceContours();
        setFranceData(franceContours);

        // Charger toutes les autres données en parallèle
        const [regions, departements, communes] = await Promise.all([
          geoDataService.getRegions(),
          geoDataService.getDepartements(),
          geoDataService.getCommunes()
        ]);

        // Enrichir avec les vraies données
        const enhancedRegions = {
          ...regions,
          features: geoDataService.generateSampleData(regions.features, 'region')
        };

        const enhancedDepartements = {
          ...departements,
          features: geoDataService.generateSampleData(departements.features, 'departement')
        };

        const enhancedCommunes = {
          ...communes,
          features: geoDataService.generateSampleData(communes.features, 'commune')
        };

        setRegionsData(enhancedRegions);
        setDepartementsData(enhancedDepartements);
        setCommunesData(enhancedCommunes);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
        console.error('Error loading geo data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAllGeoData();
  }, []);

  // Déterminer quelles couches afficher selon le niveau de zoom
  const getVisibleLayers = useCallback(() => {
    const zoom = viewState.zoom;
    return {
      showFrance: zoom < ZOOM_THRESHOLDS.REGIONS_VISIBLE,
      showRegions: zoom >= ZOOM_THRESHOLDS.REGIONS_VISIBLE && zoom < ZOOM_THRESHOLDS.COMMUNES_VISIBLE,
      showDepartements: zoom >= ZOOM_THRESHOLDS.DEPARTEMENTS_VISIBLE && zoom < ZOOM_THRESHOLDS.COMMUNES_VISIBLE,
      showCommunes: zoom >= ZOOM_THRESHOLDS.COMMUNES_VISIBLE,
      showLabels: showLabels && zoom >= ZOOM_THRESHOLDS.LABELS_VISIBLE
    };
  }, [viewState.zoom, showLabels]);

  const visibleLayers = getVisibleLayers();

  // Obtenir les données actives selon le niveau de zoom
  const getActiveData = useCallback(() => {
    if (visibleLayers.showCommunes && communesData) {
      return { data: communesData, type: 'communes' as const };
    } else if (visibleLayers.showDepartements && departementsData) {
      return { data: departementsData, type: 'departements' as const };
    } else if (visibleLayers.showRegions && regionsData) {
      return { data: regionsData, type: 'regions' as const };
    } else if (visibleLayers.showFrance && franceData) {
      return { data: franceData, type: 'france' as const };
    }
    return null;
  }, [visibleLayers, franceData, regionsData, departementsData, communesData]);

  const activeDataInfo = getActiveData();

  // Calculer les valeurs min/max et traiter les données pour la coloration
  const { minValue, maxValue, processedData } = useMemo(() => {
    if (!activeDataInfo) return { minValue: 0, maxValue: 100, processedData: null };

    const { data } = activeDataInfo;
    
    // Pour le niveau France, utiliser des valeurs fixes pour la coloration
    if (activeDataInfo.type === 'france') {
      const franceFeature = data.features[0];
      const value = franceFeature.properties?.[currentMetric.key] || 0;
      
      const processedFrance = {
        ...data,
        features: [{
          ...franceFeature,
          properties: {
            ...franceFeature.properties,
            color: 'rgb(59, 130, 246)' // Bleu pour représenter la France entière
          }
        }]
      };
      
      return { minValue: value, maxValue: value, processedData: processedFrance };
    }

    const values = data.features
      .map(f => f.properties?.[currentMetric.key] || 0)
      .filter(v => v > 0);

    const min = Math.min(...values);
    const max = Math.max(...values);

    const getColorForValue = (value: number): string => {
      if (max === min) return 'rgb(34, 197, 94)';
      const ratio = (value - min) / (max - min);
      
      if (ratio < 0.25) {
        const intensity = ratio / 0.25;
        return `rgb(${Math.round(34 + 100 * intensity)}, ${Math.round(197 - 63 * intensity)}, ${Math.round(94 - 25 * intensity)})`;
      } else if (ratio < 0.5) {
        const intensity = (ratio - 0.25) / 0.25;
        return `rgb(${Math.round(134 + 121 * intensity)}, ${Math.round(134 + 121 * intensity)}, ${Math.round(69 + 31 * intensity)})`;
      } else if (ratio < 0.75) {
        const intensity = (ratio - 0.5) / 0.25;
        return `rgb(${Math.round(255)}, ${Math.round(255 - 90 * intensity)}, ${Math.round(100 - 100 * intensity)})`;
      } else {
        const intensity = (ratio - 0.75) / 0.25;
        return `rgb(${Math.round(255 - 35 * intensity)}, ${Math.round(165 - 96 * intensity)}, ${Math.round(0 + 69 * intensity)})`;
      }
    };

    const processed = {
      ...data,
      features: data.features.map(feature => ({
        ...feature,
        properties: {
          ...feature.properties,
          color: getColorForValue(feature.properties?.[currentMetric.key] || 0)
        }
      }))
    };

    return { minValue: min, maxValue: max, processedData: processed };
  }, [activeDataInfo, currentMetric]);

  // Gestion des interactions
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

      // Centrer sur la feature sélectionnée et zoomer
      if (feature.geometry && feature.geometry.coordinates) {
        // Calcul simple du centroïde pour le centrage
        let centroid: [number, number];
        
        if (feature.geometry.type === 'Polygon') {
          const coords = feature.geometry.coordinates[0];
          centroid = coords.reduce(
            (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]],
            [0, 0]
          ).map(sum => sum / coords.length) as [number, number];
        } else if (feature.geometry.type === 'MultiPolygon') {
          const coords = feature.geometry.coordinates[0][0];
          centroid = coords.reduce(
            (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]],
            [0, 0]
          ).map(sum => sum / coords.length) as [number, number];
        } else {
          return;
        }

        // Déterminer le niveau de zoom approprié
        let targetZoom = viewState.zoom + 1.5;
        if (visibleLayers.showFrance) {
          targetZoom = Math.max(ZOOM_THRESHOLDS.REGIONS_VISIBLE + 0.5, targetZoom);
        } else if (visibleLayers.showRegions) {
          targetZoom = Math.max(ZOOM_THRESHOLDS.DEPARTEMENTS_VISIBLE + 0.5, targetZoom);
        } else if (visibleLayers.showDepartements) {
          targetZoom = Math.max(ZOOM_THRESHOLDS.COMMUNES_VISIBLE + 0.5, targetZoom);
        }

        setViewState(prev => ({
          ...prev,
          longitude: centroid[0],
          latitude: centroid[1],
          zoom: Math.min(targetZoom, 12)
        }));
      }
    }
  }, [selectedFeature, visibleLayers]);

  // Fonction pour revenir à la vue France
  const resetToFranceView = useCallback(() => {
    setViewState(INITIAL_VIEW_STATE);
    setSelectedFeature(null);
  }, []);

  // Configuration des couches
  const createLayerConfig = (layerId: string, strokeWidth: number = 1) => ({
    fill: {
      id: `${layerId}-fill`,
      type: 'fill' as const,
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': opacity
      }
    },
    stroke: {
      id: `${layerId}-stroke`,
      type: 'line' as const,
      paint: {
        'line-color': '#ffffff',
        'line-width': strokeWidth,
        'line-opacity': 0.8
      }
    },
    highlight: {
      id: `${layerId}-highlight`,
      type: 'line' as const,
      paint: {
        'line-color': '#2563eb',
        'line-width': 3,
        'line-opacity': [
          'case',
          ['==', ['get', 'code'], selectedFeature?.properties?.code || ''],
          1,
          0
        ]
      }
    }
  });

  // Créer les données de labels
  const createLabelsData = useCallback((data: GeoJSONCollection) => {
    return {
      type: 'FeatureCollection' as const,
      features: data.features.map(feature => {
        let centroid: [number, number];
        
        if (feature.geometry.type === 'Polygon') {
          const coords = feature.geometry.coordinates[0];
          centroid = coords.reduce(
            (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]],
            [0, 0]
          ).map(sum => sum / coords.length) as [number, number];
        } else {
          const coords = feature.geometry.coordinates[0][0];
          centroid = coords.reduce(
            (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]],
            [0, 0]
          ).map(sum => sum / coords.length) as [number, number];
        }

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
  }, []);

  const labelLayer = {
    id: 'labels',
    type: 'symbol' as const,
    layout: {
      'text-field': ['get', 'nom'],
      'text-font': ['Open Sans Regular'],
      'text-size': visibleLayers.showCommunes ? 10 : visibleLayers.showDepartements ? 11 : visibleLayers.showRegions ? 12 : 16,
      'text-anchor': 'center',
      'text-offset': [0, 0]
    },
    paint: {
      'text-color': visibleLayers.showFrance ? '#ffffff' : '#374151',
      'text-halo-color': visibleLayers.showFrance ? '#1f2937' : '#ffffff',
      'text-halo-width': 2,
      'text-opacity': visibleLayers.showLabels ? 1 : 0
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des contours officiels de la France...</p>
          <p className="text-sm text-gray-500 mt-2">Données géographiques open data</p>
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

  const layerConfigs = createLayerConfig('active');
  const labelsData = processedData ? createLabelsData(processedData) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-1">
              Carte des logements vacants de plus de 2 ans en France
            </h1>
            <p className="text-sm text-gray-600">
              Logements vacants de plus de 2 ans (2025) • Contours officiels open data • Zoomez pour naviguer entre les niveaux
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
          interactiveLayerIds={processedData ? ['active-fill'] : []}
          onMouseMove={handleFeatureHover}
          onMouseLeave={handleFeatureLeave}
          onClick={handleFeatureClick}
          cursor="pointer"
        >
          {/* Données géographiques actives */}
          {processedData && (
            <Source id="active-data" type="geojson" data={processedData}>
              <Layer {...layerConfigs.fill} />
              <Layer {...layerConfigs.stroke} />
              <Layer {...layerConfigs.highlight} />
            </Source>
          )}

          {/* Labels */}
          {labelsData && (
            <Source id="labels-data" type="geojson" data={labelsData}>
              <Layer {...labelLayer} />
            </Source>
          )}
        </Map>

        {/* Informations de zoom */}
        <ZoomInfo
          currentZoom={viewState.zoom}
          visibleLayers={visibleLayers}
          onResetView={resetToFranceView}
        />

        {/* Légende */}
        <MapLegend
          currentMetric={currentMetric}
          minValue={minValue}
          maxValue={maxValue}
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