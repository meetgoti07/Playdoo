"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface VenueSortProps {
  sortBy: string;
  sortOrder: string;
  onChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
}

export function VenueSort({ sortBy, sortOrder, onChange }: VenueSortProps) {
  const sortOptions = [
    { value: 'rating', label: 'Rating' },
    { value: 'name', label: 'Name' },
    { value: 'price', label: 'Price' },
    { value: 'reviews', label: 'Reviews' },
    { value: 'created', label: 'Newest' },
  ];

  const handleSortChange = (newSortBy: string) => {
    onChange(newSortBy, sortOrder as 'asc' | 'desc');
  };

  const handleOrderToggle = () => {
    onChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const getSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === sortBy);
    return option?.label || 'Sort';
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Sort By Select */}
      <Select value={sortBy} onValueChange={handleSortChange}>
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort Order Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleOrderToggle}
        className="px-3"
        title={`Sort ${getSortLabel()} ${sortOrder === 'asc' ? 'ascending' : 'descending'}`}
      >
        {sortOrder === 'asc' ? (
          <ArrowUp className="w-4 h-4" />
        ) : (
          <ArrowDown className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}
