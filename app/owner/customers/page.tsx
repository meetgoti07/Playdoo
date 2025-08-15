import { Suspense } from "react";
import { CustomersHeader } from "@/components/owner/customers/CustomersHeader";
import { CustomersList } from "@/components/owner/customers/CustomersList";
import { CustomersStats } from "@/components/owner/customers/CustomersStats";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <CustomersHeader />
      
      <Suspense fallback={<Skeleton className="h-32" />}>
        <CustomersStats />
      </Suspense>
      
      <Suspense fallback={<Skeleton className="h-96" />}>
        <CustomersList />
      </Suspense>
    </div>
  );
}
