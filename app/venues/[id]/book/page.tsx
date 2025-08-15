import { Suspense } from 'react';
import { VenueBooking } from '@/components/venues/VenueBooking';
import { Layout } from '@/components/layout/Layout';
import { Skeleton } from '@/components/ui/skeleton';

interface VenueBookingPageProps {
  params: {
    id: string;
  };
}

function VenueBookingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function VenueBookingPage({ params }: VenueBookingPageProps) {
  const { id } = await params;
  
  return (
    <Layout>
      <Suspense fallback={<VenueBookingSkeleton />}>
        <VenueBooking venueId={id} />
      </Suspense>
    </Layout>
  );
}
