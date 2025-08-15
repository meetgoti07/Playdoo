"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Wrench, Filter, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MaintenanceModal } from "./MaintenanceModal";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface MaintenanceHeaderProps {
  onMaintenanceCreated?: () => void;
}

export function MaintenanceHeader({ onMaintenanceCreated }: MaintenanceHeaderProps) {
  // Get facilities for filter
  const { data: facilitiesData } = useSWR("/api/owner/facilities", fetcher);
  const facilities = facilitiesData?.facilities || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maintenance Management</h1>
          <p className="text-gray-600 mt-1">Schedule and track facility maintenance</p>
        </div>
        
        <MaintenanceModal onMaintenanceCreated={onMaintenanceCreated} />
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Wrench className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search maintenance records..."
            className="pl-10"
          />
        </div>
        
        <Select>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Facility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Facilities</SelectItem>
            {facilities.map((facility: any) => (
              <SelectItem key={facility.id} value={facility.id}>
                {facility.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          className="w-40"
          placeholder="Select date"
        />
      </div>
    </div>
  );
}
