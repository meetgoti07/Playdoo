"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";
import { format } from "date-fns";

interface MaintenanceEvent {
  id: string;
  title: string;
  court: {
    name: string;
    facility: {
      name: string;
    };
  };
  status: string;
  startDate: string;
  endDate: string;
  description?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function MaintenanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch maintenance data
  const { data, error, isLoading } = useSWR("/api/owner/maintenance", fetcher);

  // Generate month view
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    const startDay = firstDay.getDay(); // 0 = Sunday
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === "next" ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getMaintenanceForDate = (date: Date | null): MaintenanceEvent[] => {
    if (!date || !data?.maintenance) return [];
    
    const dateStr = format(date, 'yyyy-MM-dd');
    
    return data.maintenance.filter((maintenance: any) => {
      const startDate = format(new Date(maintenance.startDate), 'yyyy-MM-dd');
      const endDate = format(new Date(maintenance.endDate), 'yyyy-MM-dd');
      
      // Check if the date falls within the maintenance period
      return dateStr >= startDate && dateStr <= endDate;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "active":
        return "bg-blue-100 text-blue-800";
      case "scheduled":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Maintenance Calendar</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Maintenance Calendar</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load maintenance calendar</p>
        </CardContent>
      </Card>
    );
  }

  const monthDays = getMonthDays();
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Maintenance Calendar</span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="font-medium px-4">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            
            <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-sm">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div key={day} className="p-2 text-center font-medium text-gray-500">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {monthDays.map((date, index) => {
            const events = getMaintenanceForDate(date);
            const isToday = date && date.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                className={`min-h-[80px] p-1 border border-gray-100 ${
                  date ? 'hover:bg-gray-50 cursor-pointer' : ''
                } ${isToday ? 'bg-blue-50 border-blue-200' : ''}`}
              >
                {date && (
                  <>
                    <div className={`text-sm ${isToday ? 'font-bold text-blue-600' : ''}`}>
                      {date.getDate()}
                    </div>
                    
                    <div className="space-y-1 mt-1">
                      {events.map((event) => (
                        <div
                          key={event.id}
                          className={`text-xs p-1 rounded truncate ${getStatusColor(event.status)}`}
                          title={`${event.title} - ${event.court.facility.name} / ${event.court.name}`}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
