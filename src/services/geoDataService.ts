import { GeoJSONCollection, RegionData, DepartementData, CommuneData } from '../types/mapTypes';
import { regionVacancyData, regionNameMapping, calculateDerivedMetrics } from '../data/realData';
import { departementVacancyData, calculateDepartementDerivedMetrics } from '../data/departementData';
import { communeVacancyData, calculateCommuneDerivedMetrics } from '../data/communeData';
import { REGION_DEPARTEMENT_MAPPING } from '../data/regionDepartementMapping';
import { calculateFranceDerivedMetrics } from '../data/franceData';

const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master';
const DATA_GOUV_URL = 'https://www.data.gouv.fr/fr/datasets/r/90b9341a-e1f7-4d75-a73c-bbc010c7feeb';
// Source officielle pour les contours des DOM-TOM
const DOMTOM_CONTOURS_URL = 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions-avec-outre-mer.geojson';

class GeoDataService {
  private cache = new Map<string, any>();

  async fetchGeoJSON(path: string): Promise<GeoJSONCollection> {
    if (this.cache.has(path)) {
      return this.cache.get(path);
    }

    try {
      let response;
      
      // Utiliser data.gouv.fr pour les départements
      if (path === 'departements.geojson') {
        response = await fetch(DATA_GOUV_URL);
      } else {
        response = await fetch(`${GITHUB_BASE_URL}/${path}`);
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
      }
      const data = await response.json();
      this.cache.set(path, data);
      return data;
    } catch (error) {
      console.error(`Error fetching GeoJSON from ${path}:`, error);
      throw error;
    }
  }

  async getFranceContours(): Promise<GeoJSONCollection> {
    const cacheKey = 'france-contours';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Utiliser les données Natural Earth via GitHub pour les contours de la France
      const response = await fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
      
      if (!response.ok) {
        // Fallback vers une autre source si la première ne fonctionne pas
        const fallbackResponse = await fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson');
        if (!fallbackResponse.ok) {
          throw new Error('Failed to fetch France contours from all sources');
        }
        const fallbackData = await fallbackResponse.json();
        
        // Filtrer pour ne garder que la France
        const franceFeature = fallbackData.features.find((f: any) => 
          f.properties.ISO_A2 === 'FR' || 
          f.properties.iso_a2 === 'FR' ||
          f.properties.NAME === 'France' ||
          f.properties.name === 'France'
        );

        if (!franceFeature) {
          throw new Error('France not found in fallback data');
        }

        const franceData = {
          type: 'FeatureCollection' as const,
          features: [{
            ...franceFeature,
            properties: {
              code: 'FR',
              nom: 'France',
              ...calculateFranceDerivedMetrics()
            }
          }]
        };

        this.cache.set(cacheKey, franceData);
        return franceData;
      }

      const worldData = await response.json();
      
      // Filtrer pour ne garder que la France
      const franceFeature = worldData.features.find((f: any) => 
        f.properties.NAME === 'France' || 
        f.properties.name === 'France' ||
        f.properties.ISO_A3 === 'FRA' ||
        f.properties.iso_a3 === 'FRA'
      );

      if (!franceFeature) {
        throw new Error('France not found in world data');
      }

      // Créer le GeoJSON pour la France avec nos données
      const franceData = {
        type: 'FeatureCollection' as const,
        features: [{
          type: 'Feature' as const,
          properties: {
            code: 'FR',
            nom: 'France',
            ...calculateFranceDerivedMetrics()
          },
          geometry: franceFeature.geometry
        }]
      };

      this.cache.set(cacheKey, franceData);
      return franceData;
    } catch (error) {
      console.error('Error fetching France contours:', error);
      
      // Fallback vers un contour simplifié si tout échoue
      const fallbackFranceData = {
        type: 'FeatureCollection' as const,
        features: [{
          type: 'Feature' as const,
          properties: {
            code: 'FR',
            nom: 'France',
            ...calculateFranceDerivedMetrics()
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [[
              [-5.5, 41.0],  // Sud-ouest
              [10.0, 41.0],  // Sud-est
              [10.0, 51.5],  // Nord-est
              [-5.5, 51.5],  // Nord-ouest
              [-5.5, 41.0]   // Fermeture
            ]]
          }
        }]
      };

      this.cache.set(cacheKey, fallbackFranceData);
      return fallbackFranceData;
    }
  }

  async getRegions(): Promise<GeoJSONCollection> {
    const cacheKey = 'regions-with-domtom';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Essayer d'abord les régions avec outre-mer
      let response = await fetch(DOMTOM_CONTOURS_URL);
      
      if (!response.ok) {
        // Fallback vers les régions métropolitaines seulement
        response = await fetch(`${GITHUB_BASE_URL}/regions.geojson`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch regions data');
        }
      }

      const data = await response.json();
      
      // Si on n'a que les régions métropolitaines, ajouter manuellement les DOM-TOM
      if (!this.hasDOMTOMRegions(data)) {
        data.features.push(...this.createDOMTOMRegions());
      }

      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching regions with DOM-TOM:', error);
      
      // Fallback : créer les régions manuellement
      const fallbackData = {
        type: 'FeatureCollection' as const,
        features: [
          ...this.createMetropolitanRegions(),
          ...this.createDOMTOMRegions()
        ]
      };
      
      this.cache.set(cacheKey, fallbackData);
      return fallbackData;
    }
  }

  private hasDOMTOMRegions(data: any): boolean {
    const domtomNames = ['Guadeloupe', 'Martinique', 'Guyane', 'La Réunion', 'Mayotte'];
    return domtomNames.some(name => 
      data.features.some((f: any) => f.properties.nom === name || f.properties.name === name)
    );
  }

  private createDOMTOMRegions() {
    return [
      {
        type: 'Feature' as const,
        properties: { code: '01', nom: 'Guadeloupe' },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[[-61.8, 15.8], [-61.0, 15.8], [-61.0, 16.5], [-61.8, 16.5], [-61.8, 15.8]]]
        }
      },
      {
        type: 'Feature' as const,
        properties: { code: '02', nom: 'Martinique' },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[[-61.2, 14.4], [-60.8, 14.4], [-60.8, 14.9], [-61.2, 14.9], [-61.2, 14.4]]]
        }
      },
      {
        type: 'Feature' as const,
        properties: { code: '03', nom: 'Guyane' },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[[-54.6, 2.1], [-51.6, 2.1], [-51.6, 5.8], [-54.6, 5.8], [-54.6, 2.1]]]
        }
      },
      {
        type: 'Feature' as const,
        properties: { code: '04', nom: 'La Réunion' },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[[55.2, -21.4], [55.8, -21.4], [55.8, -20.9], [55.2, -20.9], [55.2, -21.4]]]
        }
      },
      {
        type: 'Feature' as const,
        properties: { code: '06', nom: 'Mayotte' },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[[45.0, -13.0], [45.3, -13.0], [45.3, -12.6], [45.0, -12.6], [45.0, -13.0]]]
        }
      }
    ];
  }

  private createMetropolitanRegions() {
    // Contours simplifiés des régions métropolitaines
    return [
      {
        type: 'Feature' as const,
        properties: { code: '11', nom: 'Île-de-France' },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[[1.4, 48.1], [3.6, 48.1], [3.6, 49.2], [1.4, 49.2], [1.4, 48.1]]]
        }
      },
      // Ajouter d'autres régions métropolitaines si nécessaire...
    ];
  }

  async getDepartements(): Promise<GeoJSONCollection> {
    const cacheKey = 'departements-with-domtom';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Récupérer les départements depuis data.gouv.fr
      const response = await fetch(DATA_GOUV_URL);
      
      if (!response.ok) {
        throw new Error('Failed to fetch departements data');
      }

      const data = await response.json();
      
      // Vérifier si les DOM-TOM sont inclus
      const hasDOMTOM = data.features.some((f: any) => 
        ['971', '972', '973', '974', '976'].includes(f.properties.code)
      );

      // Si les DOM-TOM ne sont pas inclus, les ajouter manuellement
      if (!hasDOMTOM) {
        data.features.push(...this.createDOMTOMDepartements());
      }

      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Error fetching departements with DOM-TOM:', error);
      
      // Fallback vers les données de base
      return this.fetchGeoJSON('departements.geojson');
    }
  }

  private createDOMTOMDepartements() {
    return [
      {
        type: 'Feature' as const,
        properties: { code: '971', nom: 'Guadeloupe' },
        geometry: {
          type: 'MultiPolygon' as const,
          coordinates: [[[[-61.8, 15.8], [-61.0, 15.8], [-61.0, 16.5], [-61.8, 16.5], [-61.8, 15.8]]]]
        }
      },
      {
        type: 'Feature' as const,
        properties: { code: '972', nom: 'Martinique' },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[[-61.2, 14.4], [-60.8, 14.4], [-60.8, 14.9], [-61.2, 14.9], [-61.2, 14.4]]]
        }
      },
      {
        type: 'Feature' as const,
        properties: { code: '973', nom: 'Guyane' },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[[-54.6, 2.1], [-51.6, 2.1], [-51.6, 5.8], [-54.6, 5.8], [-54.6, 2.1]]]
        }
      },
      {
        type: 'Feature' as const,
        properties: { code: '974', nom: 'La Réunion' },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[[55.2, -21.4], [55.8, -21.4], [55.8, -20.9], [55.2, -20.9], [55.2, -21.4]]]
        }
      },
      {
        type: 'Feature' as const,
        properties: { code: '976', nom: 'Mayotte' },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[[45.0, -13.0], [45.3, -13.0], [45.3, -12.6], [45.0, -12.6], [45.0, -13.0]]]
        }
      }
    ];
  }

  async getDepartementsForRegion(regionCode: string): Promise<GeoJSONCollection> {
    const allDepartements = await this.getDepartements();
    
    // Trouver le nom de la région à partir du code
    const allRegions = await this.getRegions();
    const region = allRegions.features.find(f => f.properties.code === regionCode);
    const regionName = region?.properties?.nom;
    
    if (!regionName || !REGION_DEPARTEMENT_MAPPING[regionName]) {
      return { type: 'FeatureCollection', features: [] };
    }
    
    const departementCodes = REGION_DEPARTEMENT_MAPPING[regionName];
    
    return {
      type: 'FeatureCollection',
      features: allDepartements.features.filter(
        feature => departementCodes.includes(feature.properties.code)
      )
    };
  }

  async getCommunes(): Promise<GeoJSONCollection> {
    return this.fetchGeoJSON('communes.geojson');
  }

  async getCommunesForDepartement(departementCode: string): Promise<GeoJSONCollection> {
    const allCommunes = await this.getCommunes();
    return {
      type: 'FeatureCollection',
      features: allCommunes.features.filter(
        feature => feature.properties.code.startsWith(departementCode)
      )
    };
  }

  // Enrichir les données avec les vraies données de vacance
  enrichWithRealData(features: any[], type: 'france' | 'region' | 'departement' | 'commune') {
    return features.map(feature => {
      const featureName = feature.properties?.nom;
      const featureCode = feature.properties?.code;
      
      if (type === 'france' && featureCode === 'FR') {
        // Données déjà enrichies lors de la création
        return feature;
      } else if (type === 'region' && featureName) {
        // Utiliser les vraies données pour les régions (incluant DOM-TOM)
        const realData = calculateDerivedMetrics(featureName);
        
        if (realData) {
          return {
            ...feature,
            properties: {
              ...feature.properties,
              population: realData.population,
              superficie: realData.superficie,
              densite: realData.densite,
              pp_vacant_plus_2ans_25: realData.pp_vacant_plus_2ans_25,
              tauxVacancePour1000: realData.tauxVacancePour1000,
              vacanceParKm2: realData.vacanceParKm2,
              // Marquer les DOM-TOM
              isDOMTOM: ['Guadeloupe', 'Martinique', 'Guyane', 'La Réunion', 'Mayotte'].includes(featureName),
              // Garder quelques métriques générées pour la démonstration
              economicIndex: Math.round(Math.random() * 40 + 60),
              tourismScore: Math.round(Math.random() * 50 + 50)
            }
          };
        }
      } else if (type === 'departement' && featureCode) {
        // Utiliser les vraies données pour les départements (incluant DOM-TOM)
        const realData = calculateDepartementDerivedMetrics(featureCode);
        
        if (realData) {
          return {
            ...feature,
            properties: {
              ...feature.properties,
              population: realData.population,
              superficie: realData.superficie,
              densite: realData.densite,
              pp_vacant_plus_2ans_25: realData.pp_vacant_plus_2ans_25,
              tauxVacancePour1000: realData.tauxVacancePour1000,
              vacanceParKm2: realData.vacanceParKm2,
              // Marquer les DOM-TOM
              isDOMTOM: ['971', '972', '973', '974', '976'].includes(featureCode),
              // Garder quelques métriques générées pour la démonstration
              economicIndex: Math.round(Math.random() * 40 + 60),
              tourismScore: Math.round(Math.random() * 50 + 50)
            }
          };
        }
      } else if (type === 'commune' && featureCode) {
        // Utiliser les vraies données pour les communes
        const realData = calculateCommuneDerivedMetrics(featureCode);
        
        if (realData) {
          return {
            ...feature,
            properties: {
              ...feature.properties,
              pp_vacant_plus_2ans_25: realData.pp_vacant_plus_2ans_25,
              tauxVacancePour1000: realData.tauxVacancePour1000,
              vacanceParKm2: realData.vacanceParKm2,
              // Marquer les communes DOM-TOM
              isDOMTOM: ['971', '972', '973', '974', '976'].some(code => featureCode.startsWith(code)),
              // Générer des données aléatoires pour les autres métriques
              population: Math.round(Math.random() * 10000 + 500),
              superficie: Math.round(Math.random() * 50 + 5),
              densite: Math.round(Math.random() * 200 + 50),
              economicIndex: Math.round(Math.random() * 40 + 60),
              tourismScore: Math.round(Math.random() * 50 + 50)
            }
          };
        }
      }
      
      // Pour les territoires non trouvés, générer des données basées sur le type
      const basePopulation = type === 'commune' ? 5000 : type === 'departement' ? 300000 : 1000000;
      const variation = Math.random() * 0.8 + 0.2;
      
      return {
        ...feature,
        properties: {
          ...feature.properties,
          population: Math.round(basePopulation * variation),
          superficie: Math.round(Math.random() * 5000 + 500),
          densite: Math.round(Math.random() * 200 + 50),
          pp_vacant_plus_2ans_25: Math.round((basePopulation * variation) * (Math.random() * 0.05 + 0.01)),
          tauxVacancePour1000: Math.round(Math.random() * 50 + 10),
          vacanceParKm2: Math.round(Math.random() * 10 + 1),
          isDOMTOM: false,
          economicIndex: Math.round(Math.random() * 40 + 60),
          tourismScore: Math.round(Math.random() * 50 + 50)
        }
      };
    });
  }

  // Méthode mise à jour pour utiliser les vraies données
  generateSampleData(features: any[], type: 'france' | 'region' | 'departement' | 'commune') {
    return this.enrichWithRealData(features, type);
  }
}

export const geoDataService = new GeoDataService();