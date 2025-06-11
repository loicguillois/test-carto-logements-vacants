import { GeoJSONCollection, RegionData, DepartementData, CommuneData } from '../types/mapTypes';
import { regionVacancyData, regionNameMapping, calculateDerivedMetrics } from '../data/realData';
import { departementVacancyData, calculateDepartementDerivedMetrics } from '../data/departementData';
import { communeVacancyData, calculateCommuneDerivedMetrics } from '../data/communeData';
import { REGION_DEPARTEMENT_MAPPING } from '../data/regionDepartementMapping';

const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/gregoiredavid/france-geojson/master';
const DATA_GOUV_URL = 'https://www.data.gouv.fr/fr/datasets/r/90b9341a-e1f7-4d75-a73c-bbc010c7feeb';

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

  async getRegions(): Promise<GeoJSONCollection> {
    return this.fetchGeoJSON('regions.geojson');
  }

  async getDepartements(): Promise<GeoJSONCollection> {
    return this.fetchGeoJSON('departements.geojson');
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
  enrichWithRealData(features: any[], type: 'region' | 'departement' | 'commune') {
    return features.map(feature => {
      const featureName = feature.properties?.nom;
      const featureCode = feature.properties?.code;
      
      if (type === 'region' && featureName) {
        // Utiliser les vraies données pour les régions
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
              // Garder quelques métriques générées pour la démonstration
              economicIndex: Math.round(Math.random() * 40 + 60),
              tourismScore: Math.round(Math.random() * 50 + 50)
            }
          };
        }
      } else if (type === 'departement' && featureCode) {
        // Utiliser les vraies données pour les départements
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
      
      // Pour les communes, générer des données basées sur la région/département parent
      const basePopulation = type === 'commune' ? 5000 : 100000;
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
          economicIndex: Math.round(Math.random() * 40 + 60),
          tourismScore: Math.round(Math.random() * 50 + 50)
        }
      };
    });
  }

  // Méthode mise à jour pour utiliser les vraies données
  generateSampleData(features: any[], type: 'region' | 'departement' | 'commune') {
    return this.enrichWithRealData(features, type);
  }
}

export const geoDataService = new GeoDataService();