// Référentiel officiel des régions et départements français
// Source: Code officiel géographique INSEE
export const REGION_DEPARTEMENT_MAPPING: Record<string, string[]> = {
  // Auvergne-Rhône-Alpes (code région: 84)
  'Auvergne-Rhône-Alpes': ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'],
  
  // Bourgogne-Franche-Comté (code région: 27)
  'Bourgogne-Franche-Comté': ['21', '25', '39', '58', '70', '71', '89', '90'],
  
  // Bretagne (code région: 53)
  'Bretagne': ['22', '29', '35', '56'],
  
  // Centre-Val de Loire (code région: 24)
  'Centre-Val de Loire': ['18', '28', '36', '37', '41', '45'],
  
  // Corse (code région: 94)
  'Corse': ['2A', '2B'],
  
  // Grand Est (code région: 44)
  'Grand Est': ['08', '10', '51', '52', '54', '55', '57', '67', '68'],
  
  // Hauts-de-France (code région: 32)
  'Hauts-de-France': ['02', '59', '60', '62', '80'],
  
  // Île-de-France (code région: 11)
  'Île-de-France': ['75', '77', '78', '91', '92', '93', '94', '95'],
  
  // Normandie (code région: 28)
  'Normandie': ['14', '27', '50', '61', '76'],
  
  // Nouvelle-Aquitaine (code région: 75)
  'Nouvelle-Aquitaine': ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'],
  
  // Occitanie (code région: 76)
  'Occitanie': ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'],
  
  // Pays de la Loire (code région: 52)
  'Pays de la Loire': ['44', '49', '53', '72', '85'],
  
  // Provence-Alpes-Côte d'Azur (code région: 93)
  'Provence-Alpes-Côte d\'Azur': ['04', '05', '06', '13', '83', '84'],
  
  // Départements et régions d'outre-mer
  'Guadeloupe': ['971'],
  'Martinique': ['972'],
  'Guyane': ['973'],
  'La Réunion': ['974'],
  'Mayotte': ['976']
};

// Mapping inverse : département -> région
export const DEPARTEMENT_TO_REGION: Record<string, string> = {};

// Construire le mapping inverse automatiquement
Object.entries(REGION_DEPARTEMENT_MAPPING).forEach(([regionName, departements]) => {
  departements.forEach(dept => {
    DEPARTEMENT_TO_REGION[dept] = regionName;
  });
});

// Codes régions INSEE (pour référence)
export const REGION_CODES: Record<string, string> = {
  '11': 'Île-de-France',
  '24': 'Centre-Val de Loire',
  '27': 'Bourgogne-Franche-Comté',
  '28': 'Normandie',
  '32': 'Hauts-de-France',
  '44': 'Grand Est',
  '52': 'Pays de la Loire',
  '53': 'Bretagne',
  '75': 'Nouvelle-Aquitaine',
  '76': 'Occitanie',
  '84': 'Auvergne-Rhône-Alpes',
  '93': 'Provence-Alpes-Côte d\'Azur',
  '94': 'Corse',
  '01': 'Guadeloupe',
  '02': 'Martinique',
  '03': 'Guyane',
  '04': 'La Réunion',
  '06': 'Mayotte'
};

export const getRegionNameFromCode = (regionCode: string): string | null => {
  return REGION_CODES[regionCode] || null;
};

export const getDepartementsForRegion = (regionName: string): string[] => {
  return REGION_DEPARTEMENT_MAPPING[regionName] || [];
};

export const getRegionForDepartement = (departementCode: string): string | null => {
  return DEPARTEMENT_TO_REGION[departementCode] || null;
};