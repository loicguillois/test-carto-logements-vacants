// Données agrégées pour la France entière incluant les DOM-TOM
// Calculées à partir des données régionales réelles (métropole + outre-mer)
export const franceVacancyData = {
  'France': {
    // Total incluant métropole + DOM-TOM
    pp_vacant_plus_2ans_25: 1366002, // Métropole (1308071) + DOM-TOM (57931)
    population: 68042582, // Population totale France + DOM-TOM
    superficie: 643801, // Superficie totale en km²
    regions: 18, // 13 métropolitaines + 5 outre-mer
    departements: 101, // Incluant les départements d'outre-mer
    communes: 34945, // Toutes communes françaises
    
    // Détail DOM-TOM
    domtom: {
      guadeloupe: { pp_vacant_plus_2ans_25: 16528, population: 384239 },
      martinique: { pp_vacant_plus_2ans_25: 17634, population: 364508 },
      guyane: { pp_vacant_plus_2ans_25: 7738, population: 290691 },
      reunion: { pp_vacant_plus_2ans_25: 13171, population: 873311 },
      mayotte: { pp_vacant_plus_2ans_25: 2960, population: 279471 }
    }
  }
};

export const calculateFranceDerivedMetrics = () => {
  const data = franceVacancyData['France'];
  
  return {
    ...data,
    // Taux de vacance pour 1000 habitants (incluant DOM-TOM)
    tauxVacancePour1000: Math.round((data.pp_vacant_plus_2ans_25 / data.population) * 1000),
    // Densité de population
    densite: Math.round(data.population / data.superficie),
    // Ratio vacance/superficie (logements vacants par km²)
    vacanceParKm2: Math.round(data.pp_vacant_plus_2ans_25 / data.superficie * 100) / 100,
    // Pourcentage de logements vacants
    pourcentageVacance: Math.round((data.pp_vacant_plus_2ans_25 / (data.population * 0.45)) * 100 * 100) / 100,
    
    // Statistiques spécifiques DOM-TOM
    vacanceDOMTOM: Object.values(data.domtom).reduce((sum, territory) => sum + territory.pp_vacant_plus_2ans_25, 0),
    populationDOMTOM: Object.values(data.domtom).reduce((sum, territory) => sum + territory.population, 0),
    tauxVacanceDOMTOM: Math.round((Object.values(data.domtom).reduce((sum, territory) => sum + territory.pp_vacant_plus_2ans_25, 0) / Object.values(data.domtom).reduce((sum, territory) => sum + territory.population, 0)) * 1000)
  };
};