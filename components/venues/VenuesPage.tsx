"use client";

import { useState, useEffect } from 'react';
import { useVenues, VenueFilters } from '@/hooks/swr/venues/useVenues';
import { VenueCard } from '@/components/venues/VenueCard';
import { VenueFilters as VenueFiltersComponent } from '@/components/venues/VenueFilters';
import { VenuePagination } from '@/components/venues/VenuePagination';
import { VenueSort } from '@/components/venues/VenueSort';
import { VenueSearch } from '@/components/venues/VenueSearch';
import { VenueGridSkeleton } from '@/components/venues/VenueGridSkeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  MapPin, 
  Building2,
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function VenuesPage() {
  const [filters, setFilters] = useState<VenueFilters>({
    page: 1,
    limit: 6,
    sortBy: 'rating',
    sortOrder: 'desc'
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const { venues, pagination, filterOptions, isLoading, error, mutate } = useVenues(filters);

  // Update page in URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value.toString());
      }
    });
    
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [filters]);

  // Initialize filters from URL params on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const initialFilters: VenueFilters = { ...filters };
    
    urlParams.forEach((value, key) => {
      if (key === 'page' || key === 'limit' || key === 'minPrice' || key === 'maxPrice' || key === 'minRating') {
        initialFilters[key as keyof VenueFilters] = parseInt(value, 10) as any;
      } else {
        initialFilters[key as keyof VenueFilters] = value as any;
      }
    });
    
    setFilters(initialFilters);
  }, []);

  const handleFilterChange = (newFilters: Partial<VenueFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setFilters({
      page: 1,
      limit: 12,
      sortBy: 'rating',
      sortOrder: 'desc'
    });
  };

  const hasActiveFilters = Boolean(
    filters.city || 
    filters.state || 
    filters.sportType || 
    filters.venueType || 
    filters.minPrice || 
    filters.maxPrice || 
    filters.minRating || 
    filters.search
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Error Loading Venues</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Failed to load venues. Please try again.
            </p>
            <Button onClick={() => mutate()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Sports Venues
                </h1>
                <p className="text-gray-600 mt-1">
                  Discover and book amazing sports facilities near you
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="px-3 py-1">
                  <Building2 className="w-4 h-4 mr-1" />
                  {pagination?.totalCount || 0} venues
                </Badge>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <VenueSearch
                  value={filters.search || ''}
                  onChange={(search: string) => handleFilterChange({ search })}
                  placeholder="Search venues, cities, or sports..."
                />
              </div>
              
              <div className="flex items-center space-x-2">
                {/* Sort */}
                <VenueSort
                  sortBy={filters.sortBy || 'rating'}
                  sortOrder={filters.sortOrder || 'desc'}
                  onChange={(sortBy: string, sortOrder: 'asc' | 'desc') => handleFilterChange({ 
                    sortBy: sortBy as 'name' | 'rating' | 'price' | 'reviews' | 'created', 
                    sortOrder 
                  })}
                />

                {/* Filter Toggle */}
                <Button
                  variant={showFilters ? "default" : "outline"}
                  onClick={() => setShowFilters(!showFilters)}
                  className="whitespace-nowrap"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-2" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="destructive" className="ml-2 px-1 min-w-0 h-5">
                      !
                    </Badge>
                  )}
                </Button>

                {/* View Mode Toggle */}
                <div className="hidden sm:flex items-center border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={cn(
            "lg:w-80 transition-all duration-300",
            showFilters ? "block" : "hidden lg:block"
          )}>
            <div className="sticky top-4">
              <VenueFiltersComponent
                filters={filters}
                filterOptions={filterOptions}
                onChange={handleFilterChange}
                onClear={handleClearFilters}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </div>

          {/* Venues Grid/List */}
          <div className="flex-1">
            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Active Filters:</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.state && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      State: {filters.state}
                      <button
                        onClick={() => handleFilterChange({ state: undefined, city: undefined })}
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {filters.city && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      City: {filters.city}
                      <button
                        onClick={() => handleFilterChange({ city: undefined })}
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {filters.sportType && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {filters.sportType}
                      <button
                        onClick={() => handleFilterChange({ sportType: undefined })}
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {filters.venueType && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {filters.venueType}
                      <button
                        onClick={() => handleFilterChange({ venueType: undefined })}
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {(filters.minPrice || filters.maxPrice) && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      ₹{filters.minPrice || 0} - ₹{filters.maxPrice || '∞'}
                      <button
                        onClick={() => handleFilterChange({ minPrice: undefined, maxPrice: undefined })}
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {filters.minRating && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {filters.minRating}+ stars
                      <button
                        onClick={() => handleFilterChange({ minRating: undefined })}
                        className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Results */}
            {isLoading ? (
              <VenueGridSkeleton count={12} viewMode={viewMode} />
            ) : venues.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No venues found
                </h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or search terms
                </p>
                {hasActiveFilters && (
                  <Button onClick={handleClearFilters} variant="outline">
                    Clear all filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Results Count */}
                <div className="flex items-center justify-between mb-6">
                  <p className="text-sm text-gray-600">
                    Showing {venues.length} of {pagination?.totalCount || 0} venues
                    {pagination && pagination.totalPages > 1 && (
                      <span> (Page {pagination.currentPage} of {pagination.totalPages})</span>
                    )}
                  </p>
                </div>

                {/* Venues Grid */}
                <div className={cn(
                  "grid gap-6 mb-8",
                  viewMode === 'grid' 
                    ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" 
                    : "grid-cols-1"
                )}>
                  {venues.map((venue) => (
                    <VenueCard
                      key={venue.id}
                      venue={venue}
                      viewMode={viewMode}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <VenuePagination
                    pagination={pagination}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
