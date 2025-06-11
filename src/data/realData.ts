// Données réelles de logements vacants de plus de 2 ans en 2025 par région
export const regionVacancyData = {
  // DOM-TOM (Départements et Régions d'outre-mer)
  'Guadeloupe': {
    pp_vacant_plus_2ans_25: 16528,
    population: 384239,
    superficie: 1628
  },
  'Martinique': {
    pp_vacant_plus_2ans_25: 17634,
    population: 364508,
    superficie: 1128
  },
  'Guyane': {
    pp_vacant_plus_2ans_25: 7738,
    population: 290691,
    superficie: 83534
  },
  'La Réunion': {
    pp_vacant_plus_2ans_25: 13171,
    population: 873311,
    superficie: 2512
  },
  'Mayotte': {
    pp_vacant_plus_2ans_25: 2960,
    population: 279471,
    superficie: 374
  },
  // Régions métropolitaines
  'Île-de-France': {
    pp_vacant_plus_2ans_25: 134275,
    population: 12278210,
    superficie: 12012
  },
  'Centre-Val de Loire': {
    pp_vacant_plus_2ans_25: 63032,
    population: 2572853,
    superficie: 39151
  },
  'Bourgogne-Franche-Comté': {
    pp_vacant_plus_2ans_25: 85173,
    population: 2795301,
    superficie: 47784
  },
  'Normandie': {
    pp_vacant_plus_2ans_25: 58877,
    population: 3325032,
    superficie: 29906
  },
  'Hauts-de-France': {
    pp_vacant_plus_2ans_25: 90870,
    population: 5965023,
    superficie: 31813
  },
  'Grand Est': {
    pp_vacant_plus_2ans_25: 128547,
    population: 5511747,
    superficie: 57433
  },
  'Pays de la Loire': {
    pp_vacant_plus_2ans_25: 50182,
    population: 3817892,
    superficie: 32082
  },
  'Bretagne': {
    pp_vacant_plus_2ans_25: 64734,
    population: 3373835,
    superficie: 27208
  },
  'Nouvelle-Aquitaine': {
    pp_vacant_plus_2ans_25: 154424,
    population: 6010289,
    superficie: 84036
  },
  'Occitanie': {
    pp_vacant_plus_2ans_25: 154486,
    population: 5924858,
    superficie: 72724
  },
  'Auvergne-Rhône-Alpes': {
    pp_vacant_plus_2ans_25: 183182,
    population: 8078654,
    superficie: 69711
  },
  'Provence-Alpes-Côte d\'Azur': {
    pp_vacant_plus_2ans_25: 106843,
    population: 5059473,
    superficie: 31400
  },
  'Corse': {
    pp_vacant_plus_2ans_25: 15814,
    population: 344679,
    superficie: 8722
  }
};

// Mapping des noms de régions pour correspondre aux données GeoJSON
export const regionNameMapping: Record<string, string> = {
  // DOM-TOM (Région = Département)
  'Guadeloupe': 'Guadeloupe',
  'Martinique': 'Martinique',
  'Guyane': 'Guyane',
  'La Réunion': 'La Réunion',
  'Mayotte': 'Mayotte',
  // Régions métropolitaines
  'Île-de-France': 'Île-de-France',
  'Centre-Val de Loire': 'Centre-Val de Loire',
  'Bourgogne-Franche-Comté': 'Bourgogne-Franche-Comté',
  'Normandie': 'Normandie',
  'Hauts-de-France': 'Hauts-de-France',
  'Grand Est': 'Grand Est',
  'Pays de la Loire': 'Pays de la Loire',
  'Bretagne': 'Bretagne',
  'Nouvelle-Aquitaine': 'Nouvelle-Aquitaine',
  'Occitanie': 'Occitanie',
  'Auvergne-Rhône-Alpes': 'Auvergne-Rhône-Alpes',
  'Provence-Alpes-Côte d\'Azur': 'Provence-Alpes-Côte d\'Azur',
  'Corse': 'Corse'
};

// Mapping des codes DOM-TOM (région = département)
export const domtomCodeMapping: Record<string, string> = {
  '971': 'Guadeloupe',
  '972': 'Martinique',
  '973': 'Guyane',
  '974': 'La Réunion',
  '976': 'Mayotte'
};

export const calculateDerivedMetrics = (regionName: string) => {
  const data = regionVacancyData[regionName as keyof typeof regionVacancyData];
  if (!data) return null;

  const isDOMTOM = ['Guadeloupe', 'Martinique', 'Guyane', 'La Réunion', 'Mayotte'].includes(regionName);

  return {
    ...data,
    // Taux de vacance pour 1000 habitants
    tauxVacancePour1000: Math.round((data.pp_vacant_plus_2ans_25 / data.population) * 1000),
    // Densité de population
    densite: Math.round(data.population / data.superficie),
    // Ratio vacance/superficie (logements vacants par km²)
    vacanceParKm2: Math.round(data.pp_vacant_plus_2ans_25 / data.superficie * 100) / 100,
    // Marquer les DOM-TOM
    isDOMTOM,
    isRegionDepartement: isDOMTOM
  };
};

// Fonction pour obtenir les données par code DOM-TOM
export const getDOMTOMDataByCode = (code: string) => {
  const regionName = domtomCodeMapping[code];
  if (!regionName) return null;
  
  return calculateDerivedMetrics(regionName);
};