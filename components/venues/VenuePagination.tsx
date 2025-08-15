"use client";

import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { VenuesPagination } from '@/hooks/swr/venues/useVenues';

interface VenuePaginationProps {
  pagination: VenuesPagination;
  onPageChange: (page: number) => void;
}

export function VenuePagination({ pagination, onPageChange }: VenuePaginationProps) {
  const { currentPage, totalPages, hasNextPage, hasPreviousPage } = pagination;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    // Calculate the range of pages to show
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    // Add first page
    if (currentPage - delta > 2) {
      rangeWithDots.push(1, 'dots1');
    } else {
      rangeWithDots.push(1);
    }

    // Add pages in range
    rangeWithDots.push(...range);

    // Add last page
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('dots2', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center space-x-2">
      {/* First Page */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(1)}
        disabled={!hasPreviousPage}
        className="hidden sm:flex"
      >
        <ChevronsLeft className="w-4 h-4" />
      </Button>

      {/* Previous Page */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPreviousPage}
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline ml-1">Previous</span>
      </Button>

      {/* Page Numbers */}
      <div className="flex items-center space-x-1">
        {pageNumbers.map((pageNumber, index) => {
          if (pageNumber === 'dots1' || pageNumber === 'dots2') {
            return (
              <div key={`dots-${index}`} className="px-2">
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </div>
            );
          }

          const page = pageNumber as number;
          const isCurrentPage = page === currentPage;

          return (
            <Button
              key={page}
              variant={isCurrentPage ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page)}
              className={cn(
                "min-w-[2.5rem]",
                isCurrentPage && "bg-primary text-primary-foreground"
              )}
            >
              {page}
            </Button>
          );
        })}
      </div>

      {/* Next Page */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
      >
        <span className="hidden sm:inline mr-1">Next</span>
        <ChevronRight className="w-4 h-4" />
      </Button>

      {/* Last Page */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(totalPages)}
        disabled={!hasNextPage}
        className="hidden sm:flex"
      >
        <ChevronsRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
