"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Star, 
  IndianRupee, 
  Building2, 
  Activity,
  X,
  RotateCcw
} from 'lucide-react';
import { VenueFilters as VenueFiltersType, VenuesFiltersOptions } from '@/hooks/swr/venues/useVenues';
import { useStates, useCities } from '@/hooks/swr/useLocations';

interface VenueFiltersProps {
  filters: VenueFiltersType;
  filterOptions?: VenuesFiltersOptions;
  onChange: (filters: Partial<VenueFiltersType>) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

export function VenueFilters({ 
  filters, 
  filterOptions, 
  onChange, 
  onClear, 
  hasActiveFilters 
}: VenueFiltersProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice || filterOptions?.priceRange.min || 0,
    filters.maxPrice || filterOptions?.priceRange.max || 5000
  ]);

  // Location hooks for state-based city filtering
  const { states, isLoading: statesLoading } = useStates();
  const { cities, isLoading: citiesLoading, refresh: refreshCities } = useCities(filters.state);

  const formatSportType = (sportType: string) => {
    return sportType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const formatVenueType = (venueType: string) => {
    return venueType.charAt(0).toUpperCase() + venueType.slice(1).toLowerCase();
  };

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange([values[0], values[1]]);
    onChange({
      minPrice: values[0] === (filterOptions?.priceRange.min || 0) ? undefined : values[0],
      maxPrice: values[1] === (filterOptions?.priceRange.max || 5000) ? undefined : values[1]
    });
  };

  const handleRatingChange = (rating: string) => {
    onChange({
      minRating: rating === 'all' ? undefined : parseFloat(rating)
    });
  };

  return (
    <Card className="sticky top-4 ">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="text-red-600 hover:text-red-700"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Location Filters */}
        <div>
          <Label className="text-sm font-medium text-gray-700 flex items-center mb-3">
            <MapPin className="w-4 h-4 mr-2" />
            Location
          </Label>
          
          <div className="space-y-3">
            {/* State - comes first */}
            <div>
              <Label htmlFor="state" className="text-xs text-gray-600 mb-1 block">
                State
              </Label>
              <Select 
                value={filters.state || 'all'} 
                onValueChange={(value) => {
                  const newState = value === 'all' ? undefined : value;
                  console.log('State changed in venues:', { from: filters.state, to: newState });
                  // Clear city when state changes and update state
                  onChange({ state: newState, city: undefined });
                  // Refresh cities for the new state
                  if (newState) {
                    setTimeout(() => refreshCities(), 100);
                  }
                }}
                disabled={statesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City - filtered by selected state */}
            <div>
              <Label htmlFor="city" className="text-xs text-gray-600 mb-1 block">
                City {filters.state && `(${cities.length} cities in ${filters.state})`}
              </Label>
              <Select 
                value={filters.city || 'all'} 
                onValueChange={(value) => {
                  const newCity = value === 'all' ? undefined : value;
                  console.log('City changed in venues:', { state: filters.state, city: newCity });
                  onChange({ city: newCity });
                }}
                disabled={citiesLoading || !filters.state}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!filters.state ? "Select a state first" : "Select city"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {!filters.state ? 'Select a state first' : 'All Cities'}
                  </SelectItem>
                  {filters.state && cities.map((city) => {
                    console.log('Rendering city option in venues:', { state: filters.state, city });
                    return (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* Venue Type */}
        <div>
          <Label className="text-sm font-medium text-gray-700 flex items-center mb-3">
            <Building2 className="w-4 h-4 mr-2" />
            Venue Type
          </Label>
          
          <Select 
            value={filters.venueType || 'all'} 
            onValueChange={(value) => onChange({ venueType: value === 'all' ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select venue type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {filterOptions?.venueTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {formatVenueType(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Sport Type */}
        <div>
          <Label className="text-sm font-medium text-gray-700 flex items-center mb-3">
            <Activity className="w-4 h-4 mr-2" />
            Sport Type
          </Label>
          
          <Select 
            value={filters.sportType || 'all'} 
            onValueChange={(value) => onChange({ sportType: value === 'all' ? undefined : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sports</SelectItem>
              {filterOptions?.sportTypes.map((sport) => (
                <SelectItem key={sport} value={sport}>
                  {formatSportType(sport)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Price Range */}
        <div>
          <Label className="text-sm font-medium text-gray-700 flex items-center mb-3">
            <IndianRupee className="w-4 h-4 mr-2" />
            Price Range (per hour)
          </Label>
          
          <div className="px-2">
            <Slider
              value={priceRange}
              onValueChange={handlePriceRangeChange}
              min={filterOptions?.priceRange.min || 0}
              max={filterOptions?.priceRange.max || 5000}
              step={50}
              className="mb-4"
            />
            
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>₹{priceRange[0]}</span>
              <span>₹{priceRange[1]}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Rating */}
        <div>
          <Label className="text-sm font-medium text-gray-700 flex items-center mb-3">
            <Star className="w-4 h-4 mr-2" />
            Minimum Rating
          </Label>
          
          <Select 
            value={filters.minRating?.toString() || 'all'} 
            onValueChange={handleRatingChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="4.5">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  4.5+ Stars
                </div>
              </SelectItem>
              <SelectItem value="4.0">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  4.0+ Stars
                </div>
              </SelectItem>
              <SelectItem value="3.5">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  3.5+ Stars
                </div>
              </SelectItem>
              <SelectItem value="3.0">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                  3.0+ Stars
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear All Button */}
        {hasActiveFilters && (
          <>
            <Separator />
            <Button
              variant="outline"
              onClick={onClear}
              className="w-full"
            >
              <X className="w-4 h-4 mr-2" />
              Clear All Filters
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
