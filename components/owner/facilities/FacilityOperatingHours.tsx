"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Clock, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface FacilityOperatingHoursProps {
  facilityId: string;
  onUpdated?: () => void;
}

interface OperatingHour {
  id?: string;
  dayOfWeek: number;
  dayName: string;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

const daysOfWeek = [
  { value: 0, name: 'Sunday' },
  { value: 1, name: 'Monday' },
  { value: 2, name: 'Tuesday' },
  { value: 3, name: 'Wednesday' },
  { value: 4, name: 'Thursday' },
  { value: 5, name: 'Friday' },
  { value: 6, name: 'Saturday' },
];

export default function FacilityOperatingHours({ facilityId, onUpdated }: FacilityOperatingHoursProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [operatingHours, setOperatingHours] = useState<OperatingHour[]>([]);

  const { data: facilityData, mutate } = useSWR(
    `/api/owner/facilities/${facilityId}`,
    fetcher
  );

  const facility = facilityData?.facility;

  // Initialize operating hours when facility data loads
  useEffect(() => {
    if (facility?.operatingHours) {
      const hoursMap = new Map(
        facility.operatingHours.map((hour: any) => [hour.dayOfWeek, hour])
      );

      const initialHours = daysOfWeek.map(day => {
        const existingHour = hoursMap.get(day.value) as any;
        return {
          id: existingHour?.id,
          dayOfWeek: day.value,
          dayName: day.name,
          openTime: existingHour?.openTime || '09:00',
          closeTime: existingHour?.closeTime || '22:00',
          isClosed: existingHour?.isClosed || false,
        };
      });

      setOperatingHours(initialHours);
    } else {
      // Default hours if none exist
      const defaultHours = daysOfWeek.map(day => ({
        dayOfWeek: day.value,
        dayName: day.name,
        openTime: '09:00',
        closeTime: '22:00',
        isClosed: false,
      }));
      setOperatingHours(defaultHours);
    }
  }, [facility]);

  const updateDay = (dayIndex: number, field: keyof OperatingHour, value: any) => {
    setOperatingHours(prev => 
      prev.map((hour, index) => 
        index === dayIndex ? { ...hour, [field]: value } : hour
      )
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      const response = await fetch(`/api/owner/facilities/${facilityId}/operating-hours`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operatingHours: operatingHours.map(hour => ({
            dayOfWeek: hour.dayOfWeek,
            openTime: hour.isClosed ? null : hour.openTime,
            closeTime: hour.isClosed ? null : hour.closeTime,
            isClosed: hour.isClosed,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update operating hours');
      }

      toast.success('Operating hours updated successfully!');
      mutate(); // Refresh facility data
      onUpdated?.();
      setIsEditing(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update operating hours');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (time: string) => {
    return time ? new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }) : '';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Operating Hours
            </CardTitle>
            <CardDescription>
              Set the operating hours for your facility
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                Edit Hours
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {operatingHours.map((hour, index) => (
          <div key={hour.dayOfWeek} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-20">
                <Label className="font-medium">{hour.dayName}</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  checked={!hour.isClosed}
                  onCheckedChange={(checked) => updateDay(index, 'isClosed', !checked)}
                  disabled={!isEditing}
                />
                <span className="text-sm text-gray-600">
                  {hour.isClosed ? 'Closed' : 'Open'}
                </span>
              </div>
            </div>

            {!hour.isClosed && (
              <div className="flex items-center gap-4">
                {isEditing ? (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">Open Time</Label>
                      <Input
                        type="time"
                        value={hour.openTime}
                        onChange={(e) => updateDay(index, 'openTime', e.target.value)}
                        className="w-32"
                      />
                    </div>
                    <span className="text-gray-400">to</span>
                    <div className="space-y-1">
                      <Label className="text-xs">Close Time</Label>
                      <Input
                        type="time"
                        value={hour.closeTime}
                        onChange={(e) => updateDay(index, 'closeTime', e.target.value)}
                        className="w-32"
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-600">
                    {formatTime(hour.openTime)} - {formatTime(hour.closeTime)}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {operatingHours.length === 0 && (
          <div className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <p className="text-gray-500 mt-2">No operating hours set yet.</p>
            <Button 
              className="mt-4"
              onClick={() => setIsEditing(true)}
            >
              Set Operating Hours
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
