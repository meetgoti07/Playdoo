"use client";

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface VenueGridSkeletonProps {
  count?: number;
  viewMode?: 'grid' | 'list';
}

export function VenueGridSkeleton({ count = 12, viewMode = 'grid' }: VenueGridSkeletonProps) {
  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} >
            <div className="flex flex-col md:flex-row">
              {/* Image Skeleton */}
              <div className="w-full md:w-80 h-48 md:h-auto">
                <Skeleton className="w-full h-full rounded-t-lg md:rounded-l-lg md:rounded-t-none" />
              </div>

              {/* Content Skeleton */}
              <div className="flex-1 p-6">
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <Skeleton className="h-6 w-48" />
                    <div className="flex items-center ml-2">
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>

                  {/* Location */}
                  <Skeleton className="h-4 w-32 mb-3" />

                  {/* Description */}
                  <div className="space-y-2 mb-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>

                  {/* Sport Types */}
                  <div className="flex gap-2 mb-4">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-24" />
                  </div>

                  {/* Amenities */}
                  <div className="flex gap-2 mb-4">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-4" />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t mt-auto">
                    <Skeleton className="h-6 w-24" />
                    <div className="flex items-center space-x-2">
                      <Skeleton className="h-8 w-24" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  // Grid view skeleton
  return (
    <div className={cn(
      "grid gap-6",
      "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
    )}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          {/* Image Skeleton */}
          <Skeleton className="h-48 w-full" />

          {/* Content Skeleton */}
          <CardContent className="p-4">
            {/* Header */}
            <div className="mb-3">
              <Skeleton className="h-6 w-3/4 mb-1" />
              <Skeleton className="h-4 w-1/2" />
            </div>

            {/* Description */}
            <div className="space-y-2 mb-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            {/* Sport Types */}
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-16" />
            </div>

            {/* Amenities */}
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-4" />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t mb-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
