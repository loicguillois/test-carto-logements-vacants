export interface BaseGeoData {
  code: string;
  nom: string;
  population?: number;
  superficie?: number;
  densite?: number;
}

export interface RegionData extends BaseGeoData {
  departements?: DepartementData[];
}

export interface DepartementData extends BaseGeoData {
  codeRegion: string;
  communes?: CommuneData[];
}

export interface CommuneData extends BaseGeoData {
  codeDepartement: string;
  codeRegion: string;
  codePostal?: string;
}

export interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    code: string;
    nom: string;
    [key: string]: any;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface GeoJSONCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface MapMetric {
  key: string;
  label: string;
  unit: string;
  format: (value: number) => string;
}

export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

export type ZoomLevel = 'regions' | 'departements' | 'communes';

export interface MapState {
  zoomLevel: ZoomLevel;
  selectedRegion: string | null;
  selectedDepartement: string | null;
  selectedCommune: string | null;
}