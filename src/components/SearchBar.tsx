import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Navigation } from 'lucide-react';

interface SearchResult {
  type: 'region' | 'departement' | 'commune';
  code: string;
  nom: string;
  score: number;
  centroid?: [number, number];
}

interface SearchBarProps {
  onResultSelect: (result: SearchResult) => void;
  allFeatures: {
    regions: any[];
    departements: any[];
    communes: any[];
  };
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onResultSelect,
  allFeatures
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fonction de calcul de distance de Levenshtein pour la recherche approximative
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  };

  // Fonction de calcul du score de similarité
  const calculateSimilarity = (query: string, target: string): number => {
    const queryLower = query.toLowerCase().trim();
    const targetLower = target.toLowerCase().trim();
    
    // Correspondance exacte
    if (targetLower === queryLower) return 100;
    
    // Commence par la requête
    if (targetLower.startsWith(queryLower)) return 90;
    
    // Contient la requête
    if (targetLower.includes(queryLower)) return 80;
    
    // Recherche approximative avec distance de Levenshtein
    const distance = levenshteinDistance(queryLower, targetLower);
    const maxLength = Math.max(queryLower.length, targetLower.length);
    
    // Score basé sur la distance (plus la distance est faible, plus le score est élevé)
    const similarity = ((maxLength - distance) / maxLength) * 70;
    
    return Math.max(0, similarity);
  };

  // Calculer le centroïde d'une géométrie
  const calculateCentroid = (geometry: any): [number, number] => {
    if (!geometry || !geometry.coordinates) return [2.2137, 46.6034]; // Centre de la France par défaut
    
    try {
      if (geometry.type === 'Polygon') {
        const coords = geometry.coordinates[0];
        const centroid = coords.reduce(
          (acc: [number, number], coord: [number, number]) => [acc[0] + coord[0], acc[1] + coord[1]],
          [0, 0]
        ).map((sum: number) => sum / coords.length) as [number, number];
        return centroid;
      } else if (geometry.type === 'MultiPolygon') {
        const coords = geometry.coordinates[0][0];
        const centroid = coords.reduce(
          (acc: [number, number], coord: [number, number]) => [acc[0] + coord[0], acc[1] + coord[1]],
          [0, 0]
        ).map((sum: number) => sum / coords.length) as [number, number];
        return centroid;
      }
    } catch (error) {
      console.warn('Erreur lors du calcul du centroïde:', error);
    }
    
    return [2.2137, 46.6034];
  };

  // Recherche dans tous les territoires
  const searchTerritories = (searchQuery: string): SearchResult[] => {
    if (!searchQuery || searchQuery.length < 2) return [];
    
    const allResults: SearchResult[] = [];
    
    // Recherche dans les régions
    allFeatures.regions.forEach(feature => {
      const nom = feature.properties?.nom;
      if (nom) {
        const score = calculateSimilarity(searchQuery, nom);
        if (score > 30) { // Seuil de pertinence
          allResults.push({
            type: 'region',
            code: feature.properties.code,
            nom,
            score,
            centroid: calculateCentroid(feature.geometry)
          });
        }
      }
    });
    
    // Recherche dans les départements
    allFeatures.departements.forEach(feature => {
      const nom = feature.properties?.nom;
      const code = feature.properties?.code;
      if (nom) {
        const score = Math.max(
          calculateSimilarity(searchQuery, nom),
          code ? calculateSimilarity(searchQuery, code) : 0
        );
        if (score > 30) {
          allResults.push({
            type: 'departement',
            code: feature.properties.code,
            nom,
            score,
            centroid: calculateCentroid(feature.geometry)
          });
        }
      }
    });
    
    // Recherche dans les communes (limitée aux 20 meilleurs résultats pour les performances)
    const communeResults: SearchResult[] = [];
    allFeatures.communes.forEach(feature => {
      const nom = feature.properties?.nom;
      const code = feature.properties?.code;
      if (nom) {
        const score = Math.max(
          calculateSimilarity(searchQuery, nom),
          code ? calculateSimilarity(searchQuery, code) : 0
        );
        if (score > 40) { // Seuil plus élevé pour les communes
          communeResults.push({
            type: 'commune',
            code: feature.properties.code,
            nom,
            score,
            centroid: calculateCentroid(feature.geometry)
          });
        }
      }
    });
    
    // Trier les communes par score et prendre les 20 meilleures
    communeResults.sort((a, b) => b.score - a.score);
    allResults.push(...communeResults.slice(0, 20));
    
    // Trier tous les résultats par score décroissant
    return allResults.sort((a, b) => b.score - a.score).slice(0, 50); // Limiter à 50 résultats
  };

  // Effet pour la recherche
  useEffect(() => {
    if (query.length >= 2) {
      const searchResults = searchTerritories(query);
      setResults(searchResults);
      setIsOpen(true);
      setSelectedIndex(-1);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [query, allFeatures]);

  // Gestion des clics en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Gestion du clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleResultSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    setQuery(result.nom);
    setIsOpen(false);
    setSelectedIndex(-1);
    onResultSelect(result);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'region': return '🏛️';
      case 'departement': return '🏢';
      case 'commune': return '🏘️';
      default: return '📍';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'region': return 'Région';
      case 'departement': return 'Département';
      case 'commune': return 'Commune';
      default: return 'Territoire';
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      {/* Barre de recherche */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Rechercher une région, département ou commune..."
          className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-600"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        )}
      </div>

      {/* Résultats de recherche */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.code}`}
              onClick={() => handleResultSelect(result)}
              className={`w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getTypeIcon(result.type)}</span>
                  <div>
                    <div className="font-medium text-gray-900">
                      {result.nom}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <span>{getTypeLabel(result.type)}</span>
                      {result.code && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-xs">{result.code}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-400">
                    {Math.round(result.score)}% match
                  </div>
                  <Navigation className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </button>
          ))}
          
          {/* Indicateur de limitation des résultats */}
          {results.length === 50 && (
            <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t">
              Affichage des 50 premiers résultats. Affinez votre recherche pour plus de précision.
            </div>
          )}
        </div>
      )}

      {/* Message si aucun résultat */}
      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="px-4 py-6 text-center text-gray-500">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Aucun territoire trouvé</p>
            <p className="text-xs text-gray-400 mt-1">
              Essayez avec un nom différent ou moins de caractères
            </p>
          </div>
        </div>
      )}
    </div>
  );
};