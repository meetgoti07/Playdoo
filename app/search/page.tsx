import { Suspense } from 'react';
import { FacilitySearch } from '@/components/search/FacilitySearch';
import { Layout } from '@/components/layout/Layout';
import { Skeleton } from '@/components/ui/skeleton';

function SearchPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <Skeleton className="h-6 sm:h-8 w-48 sm:w-64 mb-2" />
          <Skeleton className="h-3 sm:h-4 w-72 sm:w-96" />
        </div>
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          <div className="w-full lg:w-64">
            <Skeleton className="h-32 sm:h-96 w-full" />
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-72 sm:h-80 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Layout>
      <Suspense fallback={<SearchPageSkeleton />}>
        <FacilitySearch />
      </Suspense>
    </Layout>
  );
}
