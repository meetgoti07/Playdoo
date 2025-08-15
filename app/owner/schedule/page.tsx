"use client";

import { useState } from "react";
import { startOfWeek, addWeeks, subWeeks, format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  RefreshCw, 
  Calendar,
  Building2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useOwnerSchedule } from "@/hooks/swr/schedule/useOwnerSchedule";
import { useOwnerFacilities } from "@/hooks/swr/facilities/useOwnerFacilities";
import { WeeklyCalendar } from "@/components/owner/schedule/WeeklyCalendar";
import { ScheduleStats } from "@/components/owner/schedule/ScheduleStats";
import { BlockSlotDialog } from "@/components/owner/schedule/BlockSlotDialog";

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedFacility, setSelectedFacility] = useState<string>("all");
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });

  const { 
    data: scheduleData, 
    error: scheduleError, 
    isLoading: scheduleLoading,
    mutate: refreshSchedule 
  } = useOwnerSchedule(selectedFacility === "all" ? undefined : selectedFacility, selectedDate);

  const { 
    data: facilitiesData, 
    error: facilitiesError, 
    isLoading: facilitiesLoading 
  } = useOwnerFacilities();

  const handlePreviousWeek = () => {
    setSelectedDate(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setSelectedDate(prev => addWeeks(prev, 1));
  };

  const handleThisWeek = () => {
    setSelectedDate(new Date());
  };

  const handleRefresh = () => {
    refreshSchedule();
    toast.success("Schedule refreshed");
  };

  const handleBlockSuccess = () => {
    refreshSchedule();
  };

  if (facilitiesLoading || scheduleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (facilitiesError || scheduleError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to load schedule
          </h3>
          <p className="text-gray-600 mb-4">
            {facilitiesError?.message || scheduleError?.message || "Something went wrong"}
          </p>
          <Button onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const facilities = facilitiesData?.facilities || [];
  const schedule = scheduleData?.schedule || [];

  // Debug logging to see what data we're working with
  if (process.env.NODE_ENV === 'development' && schedule.length > 0) {
    console.log('Schedule data received:', {
      facilitiesCount: schedule.length,
      totalCourts: schedule.reduce((acc, f) => acc + f.courts.length, 0),
      totalSlots: schedule.reduce((acc, f) => 
        acc + f.courts.reduce((courtAcc, c) => courtAcc + c.timeSlots.length, 0), 0
      ),
      sampleSlots: schedule.flatMap(f => f.courts.flatMap(c => c.timeSlots)).slice(0, 5)
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule Management</h1>
          <p className="text-gray-600">
            Manage your facility schedules, view bookings, and block time slots
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={scheduleLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${scheduleLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setBlockDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Block Time Slot
          </Button>
        </div>
      </div>

      <Separator />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filters & Navigation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Facility
              </label>
              <Select value={selectedFacility} onValueChange={setSelectedFacility}>
                <SelectTrigger>
                  <SelectValue placeholder="All facilities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All facilities</SelectItem>
                  {facilities.map((facility) => (
                    <SelectItem key={facility.id} value={facility.id}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {facility.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Week Navigation
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousWeek}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="text-center min-w-[200px]">
                  <div className="font-medium">
                    {format(weekStart, "MMM dd")} - {format(addWeeks(weekStart, 1), "MMM dd, yyyy")}
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleThisWeek}
                    className="text-xs p-0 h-auto"
                  >
                    Go to this week
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextWeek}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {schedule.length > 0 && (
        <ScheduleStats 
          facilities={schedule} 
          selectedFacility={selectedFacility}
        />
      )}

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyCalendar
            facilities={schedule}
            selectedFacility={selectedFacility}
            weekStartDate={weekStart}
            onRefresh={handleRefresh}
          />
        </CardContent>
      </Card>

      {/* Block Slot Dialog */}
      <BlockSlotDialog
        open={blockDialogOpen}
        onOpenChange={setBlockDialogOpen}
        facilities={schedule}
        onSuccess={handleBlockSuccess}
      />
    </div>
  );
}
