"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Filter, MapPin, Star, Clock, Users, Zap, Calendar, X, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { formatSportType } from '@/lib/utils';
import Link from 'next/link';
import { useStates, useCities } from '@/hooks/swr/useLocations';

interface SearchFilters {
  state?: string;
  city?: string;
  sport?: string;
  priceMin?: number;
  priceMax?: number;
  venueType?: string;
  rating?: number;
  availability?: string;
  amenities?: string[];
}

interface FacilityResult {
  id: string;
  hashId: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  venueType: string;
  rating?: number;
  totalReviews: number;
  isActive: boolean;
  photos: Array<{
    url: string;
    isPrimary: boolean;
  }>;
  courts: Array<{
    sportType: string;
    pricePerHour: number;
    isActive: boolean;
  }>;
  amenities: Array<{
    name: string;
    icon?: string;
  }>;
  operatingHours: Array<{
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }>;
  distance?: number;
  score: number;
  highlights?: {
    name?: string[];
    description?: string[];
  };
}

interface SearchResponse {
  query: string;
  results: FacilityResult[];
  total: { value: number };
  took: number;
  pagination: {
    current_page: number;
    per_page: number;
    total_pages: number;
  };
  aggregations?: {
    cities: Array<{ key: string; doc_count: number }>;
    sports: Array<{ key: string; doc_count: number }>;
    venueTypes: Array<{ key: string; doc_count: number }>;
    priceRanges: Array<{ key: string; doc_count: number }>;
  };
}

export function FacilitySearch() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<FacilityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [took, setTook] = useState(0);
  const [page, setPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    state: searchParams.get('state') || undefined,
    city: searchParams.get('city') || undefined,
    sport: searchParams.get('sport') || undefined,
  });
  const [suggestions, setSuggestions] = useState<Array<{
    type: 'facility' | 'location';
    name: string;
    id: string;
    subtitle?: string;
    text: string;
  }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [aggregations, setAggregations] = useState<SearchResponse['aggregations']>();
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Location hooks
  const { states, isLoading: statesLoading } = useStates();
  const { cities, isLoading: citiesLoading, refresh: refreshCities } = useCities(filters.state);

  const sportTypes = ['BADMINTON', 'TENNIS', 'FOOTBALL', 'BASKETBALL', 'CRICKET', 'SQUASH', 'TABLE_TENNIS', 'VOLLEYBALL', 'SWIMMING', 'GYM'];
  const venueTypes = ['INDOOR', 'OUTDOOR', 'HYBRID'];
  const priceRanges = [
    { label: 'Under ₹500', min: 0, max: 500 },
    { label: '₹500 - ₹1000', min: 500, max: 1000 },
    { label: '₹1000 - ₹2000', min: 1000, max: 2000 },
    { label: 'Above ₹2000', min: 2000, max: undefined },
  ];

  const searchFacilities = useCallback(async (searchQuery: string, pageNum: number = 1, searchFilters: SearchFilters = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: searchQuery || '*',
        size: '12',
        from: ((pageNum - 1) * 12).toString(),
      });

      if (searchFilters.state) params.append('state', searchFilters.state);
      if (searchFilters.city) params.append('city', searchFilters.city);
      if (searchFilters.sport) params.append('sport', searchFilters.sport);
      if (searchFilters.priceMin) params.append('priceMin', searchFilters.priceMin.toString());
      if (searchFilters.priceMax) params.append('priceMax', searchFilters.priceMax.toString());
      if (searchFilters.venueType) params.append('venueType', searchFilters.venueType);
      if (searchFilters.rating) params.append('rating', searchFilters.rating.toString());
      if (searchFilters.amenities && searchFilters.amenities.length > 0) {
        params.append('amenities', searchFilters.amenities.join(','));
      }

      const response = await fetch(`/api/search/facilities?${params}`);
      const data = await response.json();

      if (response.ok) {
        const searchResponse = data as SearchResponse;
        setResults(searchResponse.results);
        setTotal(searchResponse.total.value);
        setTook(searchResponse.took);
        setAggregations(searchResponse.aggregations);
      } else {
        console.error('Search error:', data.error || 'Unknown error');
        setResults([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Search request failed:', error);
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}&size=5`);
      const data = await response.json();

      if (response.ok && data.suggestions) {
        setSuggestions(data.suggestions);
        setShowSuggestions(data.suggestions.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Suggestions request failed:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  useEffect(() => {
    const initialQuery = searchParams.get('q');
    if (initialQuery) {
      setQuery(initialQuery);
      setHasSearched(true);
      searchFacilities(initialQuery, page);
    }
  }, [searchParams, page, filters, searchFacilities]);

  useEffect(() => {
    const suggestionsTimer = setTimeout(() => {
      fetchSuggestions(query);
    }, 150);

    return () => clearTimeout(suggestionsTimer);
  }, [query, fetchSuggestions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setShowSuggestions(false);
    setHasSearched(true);
    searchFacilities(query, 1);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setPage(1);
    setSelectedSuggestionIndex(-1);
  };

  const handleSuggestionClick = (suggestion: typeof suggestions[0]) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setPage(1);
    setHasSearched(true);
    
    if (suggestion.type === 'location') {
      const isState = states.includes(suggestion.name);
      if (isState) {
        const updatedFilters = { ...filters, state: suggestion.name, city: undefined };
        setFilters(updatedFilters);
        searchFacilities(suggestion.text, 1, updatedFilters);
      } else {
        const updatedFilters = { ...filters, city: suggestion.name };
        setFilters(updatedFilters);
        searchFacilities(suggestion.text, 1, updatedFilters);
      }
    } else {
      searchFacilities(suggestion.text, 1);
    }
  };

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    setPage(1);
    
    if (hasSearched) {
      searchFacilities(query, 1, updatedFilters);
    }
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
    
    if (hasSearched) {
      searchFacilities(query, 1, {});
    }
    setShowMobileFilters(false);
  };

  const clearFilter = (filterKey: keyof SearchFilters) => {
    const newFilters = { ...filters };
    delete newFilters[filterKey];
    setFilters(newFilters);
    setPage(1);
    
    if (hasSearched) {
      searchFacilities(query, 1, newFilters);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch(e);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        } else {
          handleSearch(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const renderHighlight = (text: string, highlights?: string[]) => {
    if (!highlights || highlights.length === 0) return text;
    const highlight = highlights[0];
    return <span dangerouslySetInnerHTML={{ __html: highlight }} />;
  };

  const getPrimaryPhoto = (photos: FacilityResult['photos']) => {
    return photos.find(p => p.isPrimary) || photos[0];
  };

  const getLowestPrice = (courts: FacilityResult['courts']) => {
    const activeCourts = courts.filter(c => c.isActive);
    if (activeCourts.length === 0) return null;
    return Math.min(...activeCourts.map(c => c.pricePerHour));
  };

  const getMainSports = (courts: FacilityResult['courts']) => {
    const activeCourts = courts.filter(c => c.isActive);
    const uniqueSports = [...new Set(activeCourts.map(c => c.sportType))];
    return uniqueSports.slice(0, 3);
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true)
  ).length;

  const renderFilters = () => (
    <>
      {activeFiltersCount > 0 && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.state && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs sm:text-sm">
                State: {filters.state}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => clearFilter('state')}
                />
              </Badge>
            )}
            {filters.city && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs sm:text-sm">
                City: {filters.city}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => clearFilter('city')}
                />
              </Badge>
            )}
            {filters.sport && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs sm:text-sm">
                Sport: {formatSportType(filters.sport)}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => clearFilter('sport')}
                />
              </Badge>
            )}
            {filters.venueType && (
              <Badge variant="outline" className="flex items-center gap-1 text-xs sm:text-sm">
                Venue: {filters.venueType}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => clearFilter('venueType')}
                />
              </Badge>
            )}
          </div>
          <div className="mt-3">
            <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
              Clear All Filters
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
          <select
            value={filters.state || ''}
            onChange={(e) => {
              const newState = e.target.value || undefined;
              handleFilterChange({ state: newState, city: undefined });
              if (newState) {
                setTimeout(() => refreshCities(), 100);
              }
            }}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            disabled={statesLoading}
          >
            <option value="">All States</option>
            {states.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City {filters.state && `(${cities.length} cities in ${filters.state})`}
          </label>
          <select
            value={filters.city || ''}
            onChange={(e) => {
              const newCity = e.target.value || undefined;
              handleFilterChange({ city: newCity });
            }}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            disabled={citiesLoading || !filters.state}
          >
            <option value="">
              {!filters.state ? 'Select a state first' : 'All Cities'}
            </option>
            {filters.state && cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
          <select
            value={filters.sport || ''}
            onChange={(e) => handleFilterChange({ sport: e.target.value || undefined })}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sports</option>
            {sportTypes.map((sport) => (
              <option key={sport} value={sport}>{formatSportType(sport)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Venue Type</label>
          <select
            value={filters.venueType || ''}
            onChange={(e) => handleFilterChange({ venueType: e.target.value || undefined })}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {venueTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Price Range (per hour)</label>
          <div className="space-y-2">
            {priceRanges.map((range) => (
              <label key={range.label} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="priceRange"
                  checked={filters.priceMin === range.min && filters.priceMax === range.max}
                  onChange={() => handleFilterChange({ 
                    priceMin: range.min, 
                    priceMax: range.max 
                  })}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{range.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
          <select
            value={filters.rating || ''}
            onChange={(e) => handleFilterChange({ rating: e.target.value ? parseFloat(e.target.value) : undefined })}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Any Rating</option>
            <option value="4">4+ Stars</option>
            <option value="3">3+ Stars</option>
            <option value="2">2+ Stars</option>
          </select>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Find Sports Facilities</h1>
          <p className="text-sm sm:text-base text-gray-600">Search and book sports venues near you</p>
        </div>

        <form onSubmit={handleSearch} className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0 && query.length >= 2) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={(e) => {
                  const relatedTarget = e.relatedTarget as HTMLElement;
                  if (relatedTarget && relatedTarget.closest('[data-suggestions-dropdown]')) {
                    return;
                  }
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search for facilities, sports, or locations..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                autoComplete="off"
              />
              
              {showSuggestions && suggestions.length > 0 && (
                <div 
                  className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1 max-h-96 overflow-y-auto"
                  data-suggestions-dropdown
                >
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.type}-${suggestion.id}-${index}`}
                      type="button"
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 first:rounded-t-lg last:rounded-b-lg ${
                        index === selectedSuggestionIndex ? 'bg-blue-50 text-blue-900' : ''
                      }`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSuggestionClick(suggestion);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {suggestion.type === 'facility' ? (
                          <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                            <Zap className="w-3 h-3 text-blue-600" />
                          </div>
                        ) : (
                          <MapPin className="w-4 h-4 text-gray-400" />
                        )}
                        <div className="flex-1">
                          <span className="text-gray-900 font-medium text-sm sm:text-base">{suggestion.name}</span>
                          {suggestion.subtitle && (
                            <div className="text-xs text-gray-500">{suggestion.subtitle}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading} className="px-4 sm:px-6 whitespace-nowrap text-sm sm:text-base">
                {loading ? 'Searching...' : 'Search'}
              </Button>
              
              <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden relative">
                    <Filter className="h-4 w-4" />
                    {activeFiltersCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  side="right" 
                  className="w-full sm:w-[400px] max-w-[90vw] p-6 overflow-y-auto"
                >
                  <SheetHeader className="mb-6">
                    <SheetTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      <Filter className="w-5 h-5" />
                      Filters
                      {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </SheetTitle>
                  </SheetHeader>
                  <div className="space-y-6">
                    {renderFilters()}
                    <Button 
                      variant="default" 
                      className="w-full mt-6"
                      onClick={() => setShowMobileFilters(false)}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </form>

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="hidden lg:block w-full lg:w-80 bg-white p-6 rounded-lg shadow-sm h-fit">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-lg text-gray-900 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </h3>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              )}
            </div>
            {renderFilters()}
          </div>

          <div className="flex-1">
            {hasSearched && (query || Object.keys(filters).length > 0) && (
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-sm text-gray-600">
                  {loading ? (
                    'Searching...'
                  ) : (
                    `Found ${total} facilities${query ? ` for "${query}"` : ''} in ${took}ms`
                  )}
                </div>
                
                <select 
                  className="text-sm border border-gray-300 rounded-md px-3 py-2 w-full sm:w-48 focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    // Handle sorting
                  }}
                >
                  <option value="relevance">Sort by Relevance</option>
                  <option value="rating">Sort by Rating</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="distance">Distance</option>
                </select>
              </div>
            )}

            {hasSearched && loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : hasSearched ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                {results.map((facility) => {
                  const primaryPhoto = getPrimaryPhoto(facility.photos);
                  const lowestPrice = getLowestPrice(facility.courts);
                  const mainSports = getMainSports(facility.courts);
                  
                  return (
                    <Card key={facility.hashId} className="group overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative h-48 overflow-hidden">
                        {primaryPhoto ? (
                          <img
                            src={primaryPhoto.url}
                            alt={facility.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <Zap className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        
                        <Badge 
                          className="absolute top-3 left-3 bg-white text-gray-900 text-xs"
                          variant="secondary"
                        >
                          {facility.venueType}
                        </Badge>

                        {facility.distance && (
                          <Badge 
                            className="absolute top-3 right-3 bg-blue-600 text-white text-xs"
                          >
                            {facility.distance.toFixed(1)} km
                          </Badge>
                        )}
                      </div>
                      
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                          {renderHighlight(facility.name, facility.highlights?.name)}
                        </h3>
                        
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="line-clamp-1">{facility.city}, {facility.state}</span>
                        </div>
                        
                        {facility.rating && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium text-sm">{facility.rating.toFixed(1)}</span>
                            </div>
                            <span className="text-sm text-gray-500">
                              ({facility.totalReviews} reviews)
                            </span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1 mb-3">
                          {mainSports.map((sport) => (
                            <Badge key={sport} variant="outline" className="text-xs">
                              {formatSportType(sport)}
                            </Badge>
                          ))}
                          {facility.courts.length > mainSports.length && (
                            <Badge variant="outline" className="text-xs">
                              +{facility.courts.length - mainSports.length} more
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {renderHighlight(facility.description, facility.highlights?.description)}
                        </p>
                        
                        {lowestPrice && (
                          <div className="flex items-center justify-between text-sm mb-3">
                            <span className="text-gray-600 text-xs sm:text-sm">Starting from</span>
                            <span className="font-semibold text-green-600 text-base">
                              ₹{lowestPrice}/hr
                            </span>
                          </div>
                        )}

                        {facility.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {facility.amenities.slice(0, 2).map((amenity) => (
                              <span key={amenity.name} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {amenity.name}
                              </span>
                            ))}
                            {facility.amenities.length > 2 && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                +{facility.amenities.length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Search Score: {facility.score.toFixed(2)}</span>
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${facility.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span>{facility.isActive ? 'Open' : 'Closed'}</span>
                          </div>
                        </div>
                      </CardContent>
                      
                      <CardFooter className="p-4 pt-0 flex flex-col sm:flex-row gap-2">
                        <Link href={`/venues/${facility.id}`} className="w-full sm:flex-1">
                          <Button variant="outline" className="w-full text-sm">
                            View Details
                          </Button>
                        </Link>
                        <Link href={`/venues/${facility.id}/book`} className="w-full sm:flex-1">
                          <Button className="w-full text-sm">
                            Book Now
                          </Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            ) : null}

            {hasSearched && !loading && (query || Object.keys(filters).length > 0) && results.length === 0 && (
              <div className="text-center py-12">
                <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No facilities found</h3>
                <p className="text-base text-gray-600 mb-4">Try adjusting your search terms or filters</p>
                <Button onClick={clearFilters} variant="outline" size="sm">
                  Clear all filters
                </Button>
              </div>
            )}

            {!hasSearched && !loading && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Search for sports facilities</h3>
                <p className="text-base text-gray-600">Enter a search term and click search to find venues</p>
              </div>
            )}

            {hasSearched && total > 12 && (
              <div className="mt-8 flex justify-center">
                <div className="flex gap-2 flex-wrap justify-center">
                  {Array.from({ length: Math.ceil(total / 12) }, (_, i) => i + 1)
                    .slice(Math.max(0, page - 3), Math.min(Math.ceil(total / 12), page + 2))
                    .map((pageNum) => (
                      <Button
                        key={pageNum}
                        variant={pageNum === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setPage(pageNum);
                          searchFacilities(query, pageNum);
                        }}
                        className="min-w-[40px] text-sm"
                      >
                        {pageNum}
                      </Button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}