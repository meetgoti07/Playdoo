"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, MapPin, Calendar, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { formatSportType } from '@/lib/utils';

interface SearchSuggestion {
  type: 'facility' | 'location' | 'sport';
  name: string;
  id: string;
  subtitle?: string;
  icon?: string;
}

export function QuickSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}&limit=8`);
      const data = await response.json();

      if (response.ok) {
        setSuggestions(data.suggestions || []);
        setShowSuggestions((data.suggestions || []).length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchSuggestions(query);
    }, 200);

    return () => clearTimeout(debounceTimer);
  }, [query, fetchSuggestions]);

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return;

    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(finalQuery)}`);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.name);
    setShowSuggestions(false);
    
    // Navigate based on suggestion type
    switch (suggestion.type) {
      case 'facility':
        router.push(`/venues/${suggestion.id}`);
        break;
      case 'location':
        router.push(`/search?location=${encodeURIComponent(suggestion.name)}`);
        break;
      case 'sport':
        router.push(`/search?sport=${encodeURIComponent(suggestion.name)}`);
        break;
      default:
        handleSearch(suggestion.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'facility':
        return <Zap className="w-4 h-4 text-blue-500" />;
      case 'location':
        return <MapPin className="w-4 h-4 text-green-500" />;
      case 'sport':
        return <Users className="w-4 h-4 text-orange-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  const popularSearches = [
    { label: 'Badminton Courts', sport: 'BADMINTON' },
    { label: 'Football Fields', sport: 'FOOTBALL' },
    { label: 'Tennis Courts', sport: 'TENNIS' },
    { label: 'Basketball Courts', sport: 'BASKETBALL' },
  ];

  return (
    <Card className="p-6 bg-white shadow-lg border-0">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Find Your Perfect Venue</h2>
          <p className="text-gray-600">Search for sports facilities, locations, or activities</p>
        </div>

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (suggestions.length > 0 && query.length >= 2) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  // Delay hiding to allow for clicks
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                placeholder="Search for venues, sports, or locations..."
                className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 transition-colors"
                autoComplete="off"
              />
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
            
            <Button 
              onClick={() => handleSearch()}
              size="lg"
              className="px-8 py-4 text-lg bg-blue-600 hover:bg-blue-700"
            >
              Search
            </Button>
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 mt-2 max-h-96 overflow-y-auto"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.id}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 first:rounded-t-xl last:rounded-b-xl transition-colors ${
                    index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getSuggestionIcon(suggestion.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 font-medium">{suggestion.name}</span>
                        <Badge 
                          variant="secondary" 
                          className="text-xs px-2 py-0.5"
                        >
                          {suggestion.type}
                        </Badge>
                      </div>
                      {suggestion.subtitle && (
                        <p className="text-sm text-gray-500 mt-1">{suggestion.subtitle}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Popular Searches */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-3">Popular searches:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {popularSearches.map((search) => (
              <Button
                key={search.sport}
                variant="outline"
                size="sm"
                onClick={() => router.push(`/search?sport=${search.sport}`)}
                className="text-sm hover:bg-blue-50 hover:border-blue-300"
              >
                {search.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
