import { Suspense } from 'react';
import { VenueDetails } from '@/components/venues/VenueDetails';
import { Layout } from '@/components/layout/Layout';
import { Skeleton } from '@/components/ui/skeleton';

interface VenuePageProps {
  params: {
    id: string;
  };
}

function VenueDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function VenuePage({ params }: VenuePageProps) {
  const { id } = await params;
  
  return (
    <Layout>
      <Suspense fallback={<VenueDetailSkeleton />}>
        <VenueDetails id={id} />
      </Suspense>
    </Layout>
  );
}
