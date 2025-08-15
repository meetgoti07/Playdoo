"use client";

import { format, addDays, startOfWeek, isSameDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock, User, DollarSign, Ban, AlertCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { unblockTimeSlot } from "@/hooks/swr/schedule/useOwnerSchedule";
import type { Facility, TimeSlot } from "@/hooks/swr/schedule/useOwnerSchedule";

interface WeeklyCalendarProps {
  facilities: Facility[];
  selectedFacility?: string;
  weekStartDate: Date;
  onSlotClick?: (slot: TimeSlot, courtId: string) => void;
  onRefresh: () => void;
}

const weekDays = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

export function WeeklyCalendar({
  facilities,
  selectedFacility,
  weekStartDate,
  onSlotClick,
  onRefresh,
}: WeeklyCalendarProps) {
  const filteredFacilities = selectedFacility && selectedFacility !== "all"
    ? facilities.filter(f => f.id === selectedFacility)
    : facilities;

  // Generate dynamic time slots based on actual data
  const getAllTimeSlots = () => {
    const allTimes = new Set<string>();
    
    // Add predefined common slots
    const commonSlots = [
      "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
      "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
      "18:00", "19:00", "20:00", "21:00", "22:00"
    ];
    commonSlots.forEach(time => allTimes.add(time));
    
    // Add times from actual data
    filteredFacilities.forEach(facility => {
      facility.courts.forEach(court => {
        court.timeSlots.forEach(slot => {
          // Handle different time formats
          let timeString = slot.startTime;
          
          try {
            // If it's already in HH:mm format
            if (typeof timeString === 'string' && timeString.match(/^\d{2}:\d{2}$/)) {
              allTimes.add(timeString);
            }
            // If it's in HH:mm:ss format
            else if (typeof timeString === 'string' && timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
              allTimes.add(timeString.substring(0, 5));
            }
            // If it's a DateTime object
            else if (timeString && typeof timeString === 'string' && timeString.includes('T')) {
              const dateObj = new Date(timeString);
              if (!isNaN(dateObj.getTime())) {
                allTimes.add(format(dateObj, 'HH:mm'));
              }
            }
            // Fallback - try to parse as date
            else if (timeString) {
              const dateObj = new Date(timeString);
              if (!isNaN(dateObj.getTime())) {
                allTimes.add(format(dateObj, 'HH:mm'));
              }
            }
          } catch (error) {
            console.warn('Error parsing time for slot generation:', timeString, error);
          }
        });
      });
    });
    
    // Convert to sorted array
    return Array.from(allTimes).sort();
  };

  const timeSlots = getAllTimeSlots();

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Generated timeSlots for calendar:', timeSlots);
    console.log('Filtered facilities:', filteredFacilities.map(f => ({
      id: f.id,
      name: f.name,
      courts: f.courts.map(c => ({
        id: c.id,
        name: c.name,
        slotsCount: c.timeSlots.length,
        sampleTimes: c.timeSlots.slice(0, 3).map(s => s.startTime)
      }))
    })));
  }

  const handleUnblockSlot = async (timeSlotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await unblockTimeSlot(timeSlotId);
      toast.success("Time slot unblocked successfully");
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to unblock time slot");
    }
  };

  const getSlotForDateTime = (courtId: string, date: Date, time: string) => {
    const facility = filteredFacilities.find(f => 
      f.courts.some(c => c.id === courtId)
    );
    const court = facility?.courts.find(c => c.id === courtId);
    
    if (!court || !court.timeSlots) {
      if (process.env.NODE_ENV === 'development') {
        console.log('No court found or no timeSlots:', { courtId, hasCourt: !!court, slotsCount: court?.timeSlots?.length || 0 });
      }
      return undefined;
    }
    
    const foundSlot = court.timeSlots.find(slot => {
      // Handle different date formats
      let slotDate: Date;
      try {
        if (typeof slot.date === 'string') {
          // If it's already a date string like "2025-08-12"
          if (slot.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            slotDate = new Date(slot.date + 'T00:00:00.000Z');
          } else {
            // If it's a full datetime string
            slotDate = new Date(slot.date);
          }
        } else {
          // If it's a Date object
          slotDate = new Date(slot.date);
        }
        
        // Normalize to just the date part
        slotDate = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());
        const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        const slotTime = slot.startTime;
        
        const isDateMatch = slotDate.getTime() === targetDate.getTime();
        const isTimeMatch = slotTime === time;
        
        return isDateMatch && isTimeMatch;
      } catch (error) {
        console.warn('Error parsing slot date:', slot.date, error);
        return false;
      }
    });
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Slot matching for:', {
        courtId,
        courtName: court.name,
        targetDate: format(date, 'yyyy-MM-dd'),
        targetTime: time,
        availableSlots: court.timeSlots.map(s => {
          let parsedDate;
          try {
            if (typeof s.date === 'string' && s.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
              parsedDate = s.date;
            } else {
              const tempDate = new Date(s.date);
              parsedDate = format(tempDate, 'yyyy-MM-dd');
            }
          } catch (e) {
            parsedDate = 'invalid';
          }
          
          return {
            id: s.id,
            originalDate: s.date,
            parsedDate,
            time: s.startTime,
            isBooked: s.isBooked,
            isBlocked: s.isBlocked
          };
        }),
        foundSlot: foundSlot ? {
          id: foundSlot.id,
          date: foundSlot.date,
          time: foundSlot.startTime,
          isBooked: foundSlot.isBooked,
          isBlocked: foundSlot.isBlocked,
          bookingStatus: foundSlot.booking?.status
        } : null
      });
    }
    
    return foundSlot;
  };

  const getSlotStatus = (slot: TimeSlot | undefined) => {
    if (!slot) return "available";
    if (slot.isBlocked) return "blocked";
    if (slot.isBooked && slot.booking) return "booked";
    return "available";
  };

  const getSlotColor = (status: string, slot?: TimeSlot) => {
    switch (status) {
      case "booked":
        // Different colors based on booking status
        if (slot?.booking?.status === "COMPLETED") {
          return "bg-green-100 border-green-300 text-green-800";
        } else if (slot?.booking?.status === "CONFIRMED") {
          return "bg-blue-100 border-blue-300 text-blue-800";
        } else if (slot?.booking?.status === "PENDING") {
          return "bg-yellow-100 border-yellow-300 text-yellow-800";
        } else {
          return "bg-blue-100 border-blue-300 text-blue-800";
        }
      case "blocked":
        return "bg-red-100 border-red-300 text-red-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100";
    }
  };

  return (
    <TooltipProvider>
      <div className="overflow-x-auto">
        <div className="min-w-[1000px]">
          {/* Header */}
          <div className="grid grid-cols-8 gap-2 mb-4">
            <div className="p-2 font-medium text-sm text-gray-600">Time</div>
            {weekDays.map((day, index) => {
              const date = addDays(weekStartDate, index);
              return (
                <div key={day} className="p-2 text-center">
                  <div className="font-medium text-sm">{day}</div>
                  <div className="text-xs text-gray-500">
                    {format(date, "MMM dd")}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calendar Grid */}
          {filteredFacilities.map((facility) =>
            facility.courts.map((court) => (
              <Card key={court.id} className="mb-6">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{facility.name}</h3>
                      <p className="text-sm text-gray-600">
                        {court.name} - {court.sportType} (₹{court.pricePerHour}/hour)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-8 gap-2">
                    {timeSlots.map((time) => (
                      <div key={`${court.id}-${time}`} className="contents">
                        {/* Time column */}
                        <div className="p-2 text-xs font-medium text-gray-600 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {time}
                        </div>

                        {/* Day columns */}
                        {weekDays.map((_, dayIndex) => {
                          const date = addDays(weekStartDate, dayIndex);
                          const slot = getSlotForDateTime(court.id, date, time);
                          const status = getSlotStatus(slot);

                          return (
                            <Tooltip key={`${court.id}-${time}-${dayIndex}`}>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    "relative p-2 border rounded-md text-xs cursor-pointer transition-colors min-h-[3rem]",
                                    getSlotColor(status, slot)
                                  )}
                                  onClick={() => slot && onSlotClick?.(slot, court.id)}
                                >
                                  {slot && (
                                    <div className="space-y-1">
                                      {status === "booked" && slot.booking && (
                                        <>
                                          <div className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            <span className="truncate text-xs">
                                              {slot.booking.user.name}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <DollarSign className="h-3 w-3" />
                                            <span className="text-xs">₹{slot.booking.totalAmount}</span>
                                          </div>
                                          <Badge 
                                            variant={slot.booking.status === 'COMPLETED' ? 'default' : 'secondary'} 
                                            className="text-xs px-1 py-0"
                                          >
                                            {slot.booking.status}
                                          </Badge>
                                        </>
                                      )}

                                      {status === "blocked" && (
                                        <>
                                          <div className="flex items-center gap-1">
                                            <Ban className="h-3 w-3" />
                                            <span className="text-xs">Blocked</span>
                                          </div>
                                          {slot.blockReason && (
                                            <div className="text-xs text-gray-600 truncate">
                                              {slot.blockReason}
                                            </div>
                                          )}
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-5 w-5 p-0 hover:bg-red-200"
                                            onClick={(e) => handleUnblockSlot(slot.id, e)}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </>
                                      )}

                                      {status === "available" && (
                                        <div className="flex items-center gap-1 justify-center text-gray-500">
                                          <Clock className="h-3 w-3" />
                                          <span className="text-xs">Available</span>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {!slot && (
                                    <div className="flex items-center gap-1 justify-center text-gray-400">
                                      <Clock className="h-3 w-3" />
                                      <span>Available</span>
                                    </div>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="space-y-1">
                                  <p className="font-medium">
                                    {format(date, "EEEE, MMM dd")} at {time}
                                  </p>
                                  {slot && status === "booked" && slot.booking && (
                                    <>
                                      <p>Customer: {slot.booking.user.name}</p>
                                      <p>Email: {slot.booking.user.email}</p>
                                      <p>Amount: ₹{slot.booking.totalAmount}</p>
                                      <p>Status: {slot.booking.status}</p>
                                    </>
                                  )}
                                  {slot && status === "blocked" && (
                                    <>
                                      <p>Status: Blocked</p>
                                      {slot.blockReason && <p>Reason: {slot.blockReason}</p>}
                                      <p className="text-xs text-gray-500">
                                        Click the trash icon to unblock
                                      </p>
                                    </>
                                  )}
                                  {(!slot || status === "available") && (
                                    <p>Available for booking</p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {filteredFacilities.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No facilities found
                </h3>
                <p className="text-gray-600">
                  {selectedFacility && selectedFacility !== "all"
                    ? "The selected facility was not found or you don't have access to it."
                    : "You don't have any facilities yet. Create one to start managing schedules."
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
