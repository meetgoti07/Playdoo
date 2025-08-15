import { NewFacilityForm } from "@/components/owner/facilities/NewFacilityForm";

export default function NewFacilityPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add New Facility</h1>
        <p className="text-gray-600 mt-2">
          Register your sports facility to start accepting bookings
        </p>
      </div>
      
      <NewFacilityForm />
    </div>
  );
}
