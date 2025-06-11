// Données agrégées pour la France entière
// Calculées à partir des données régionales réelles
export const franceVacancyData = {
  'France': {
    pp_vacant_plus_2ans_25: 1308071, // Total de tous les logements vacants +2ans en France
    population: 67842582, // Population totale de la France
    superficie: 643801, // Superficie totale en km²
    regions: 18, // Nombre de régions (13 métropolitaines + 5 outre-mer)
    departements: 101, // Nombre de départements
    communes: 34945 // Nombre approximatif de communes
  }
};

export const calculateFranceDerivedMetrics = () => {
  const data = franceVacancyData['France'];
  
  return {
    ...data,
    // Taux de vacance pour 1000 habitants
    tauxVacancePour1000: Math.round((data.pp_vacant_plus_2ans_25 / data.population) * 1000),
    // Densité de population
    densite: Math.round(data.population / data.superficie),
    // Ratio vacance/superficie (logements vacants par km²)
    vacanceParKm2: Math.round(data.pp_vacant_plus_2ans_25 / data.superficie * 100) / 100,
    // Pourcentage de logements vacants
    pourcentageVacance: Math.round((data.pp_vacant_plus_2ans_25 / (data.population * 0.45)) * 100 * 100) / 100 // Estimation basée sur ~0.45 logement par habitant
  };
};