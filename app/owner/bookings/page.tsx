import { Suspense } from "react";
import { BookingsHeader } from "@/components/owner/bookings/BookingsHeader";
import { BookingsList } from "@/components/owner/bookings/BookingsList";
import { BookingsStats } from "@/components/owner/bookings/BookingsStats";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookingsPage() {
  return (
    <div className="space-y-6">
      <BookingsHeader />
      
      <Suspense fallback={<Skeleton className="h-32" />}>
        <BookingsStats />
      </Suspense>
      
      <Suspense fallback={<Skeleton className="h-96" />}>
        <BookingsList />
      </Suspense>
    </div>
  );
}
