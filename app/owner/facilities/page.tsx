import { Suspense } from "react";
import { FacilitiesList } from "@/components/owner/facilities/FacilitiesList";
import { FacilitiesHeader } from "@/components/owner/facilities/FacilitiesHeader";
import { Skeleton } from "@/components/ui/skeleton";

export default function FacilitiesPage() {
  return (
    <div className="space-y-6">
      <FacilitiesHeader />
      
      <Suspense fallback={<Skeleton className="h-96" />}>
        <FacilitiesList />
      </Suspense>
    </div>
  );
}
