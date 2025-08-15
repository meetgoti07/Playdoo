"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Trash2, Loader2, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TimeSlotManagementProps {
  isOpen: boolean;
  onClose: () => void;
  facilityId: string;
}

interface TimeSlot {
  id?: string;
  courtId: string;
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  dayOfWeek: number;
  isActive: boolean;
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

export default function TimeSlotManagement({ isOpen, onClose, facilityId }: TimeSlotManagementProps) {
  const [selectedCourt, setSelectedCourt] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auto-generation settings
  const [autoStartTime, setAutoStartTime] = useState("09:00");
  const [autoEndTime, setAutoEndTime] = useState("22:00");
  const [slotDuration, setSlotDuration] = useState(60);
  const [defaultPrice, setDefaultPrice] = useState(100);

  const { data: facilityData } = useSWR(
    facilityId ? `/api/owner/facilities/${facilityId}` : null,
    fetcher
  );

  const { data: courtsData } = useSWR(
    facilityId ? `/api/owner/courts?facilityId=${facilityId}` : null,
    fetcher
  );

  const { data: timeSlotsData, mutate } = useSWR(
    selectedCourt && selectedDay !== undefined ? 
      `/api/owner/time-slots?courtId=${selectedCourt}&dayOfWeek=${selectedDay}` : null,
    fetcher
  );

  const facility = facilityData?.facility;
  const courts = courtsData?.courts || [];
  
  // Memoize existingSlots to prevent unnecessary re-renders
  const existingSlots = useMemo(() => {
    return timeSlotsData?.timeSlots || [];
  }, [timeSlotsData?.timeSlots]);

  useEffect(() => {
    // Only update if we have different data (prevent unnecessary state updates)
    if (existingSlots && 
        existingSlots.length !== timeSlots.length || 
        JSON.stringify(existingSlots) !== JSON.stringify(timeSlots)) {
      setTimeSlots(existingSlots);
    }
  }, [existingSlots, selectedCourt, selectedDay]); // Keep essential dependencies

  const getOperatingHours = (dayOfWeek: number) => {
    if (!facility?.operatingHours) return null;
    return facility.operatingHours.find((oh: any) => oh.dayOfWeek === dayOfWeek);
  };

  const validateTimeSlot = (slot: TimeSlot) => {
    const operatingHours = getOperatingHours(slot.dayOfWeek);
    
    if (!operatingHours || operatingHours.isClosed) {
      return "Facility is closed on this day";
    }

    const slotStart = new Date(`2000-01-01T${slot.startTime}:00`);
    const slotEnd = new Date(`2000-01-01T${slot.endTime}:00`);
    const facilityOpen = new Date(`2000-01-01T${operatingHours.openTime}:00`);
    const facilityClose = new Date(`2000-01-01T${operatingHours.closeTime}:00`);

    if (slotStart < facilityOpen || slotEnd > facilityClose) {
      return `Time slot must be within facility hours (${operatingHours.openTime} - ${operatingHours.closeTime})`;
    }

    if (slotStart >= slotEnd) {
      return "Start time must be before end time";
    }

    return null;
  };

  const generateTimeSlots = () => {
    if (!selectedCourt) {
      toast.error("Please select a court first");
      return;
    }

    const operatingHours = getOperatingHours(selectedDay);
    if (!operatingHours || operatingHours.isClosed) {
      toast.error("Facility is closed on this day");
      return;
    }

    setIsGenerating(true);

    try {
      const facilityStart = new Date(`2000-01-01T${operatingHours.openTime}:00`);
      const facilityEnd = new Date(`2000-01-01T${operatingHours.closeTime}:00`);
      const userStart = new Date(`2000-01-01T${autoStartTime}:00`);
      const userEnd = new Date(`2000-01-01T${autoEndTime}:00`);

      // Use the more restrictive time range
      const effectiveStart = userStart > facilityStart ? userStart : facilityStart;
      const effectiveEnd = userEnd < facilityEnd ? userEnd : facilityEnd;

      const slots: TimeSlot[] = [];
      let currentTime = new Date(effectiveStart);

      while (currentTime < effectiveEnd) {
        const endTime = new Date(currentTime.getTime() + slotDuration * 60000);
        
        if (endTime <= effectiveEnd) {
          slots.push({
            courtId: selectedCourt,
            startTime: currentTime.toTimeString().slice(0, 5),
            endTime: endTime.toTimeString().slice(0, 5),
            duration: slotDuration,
            price: defaultPrice,
            dayOfWeek: selectedDay,
            isActive: true,
          });
        }
        
        currentTime = endTime;
      }

      setTimeSlots(slots);
      toast.success(`Generated ${slots.length} time slots`);
    } catch (error) {
      toast.error("Failed to generate time slots");
    } finally {
      setIsGenerating(false);
    }
  };

  const addTimeSlot = () => {
    const newSlot: TimeSlot = {
      courtId: selectedCourt,
      startTime: "09:00",
      endTime: "10:00",
      duration: 60,
      price: defaultPrice,
      dayOfWeek: selectedDay,
      isActive: true,
    };
    setTimeSlots([...timeSlots, newSlot]);
  };

  const updateTimeSlot = (index: number, field: keyof TimeSlot, value: any) => {
    setTimeSlots(prev => 
      prev.map((slot, i) => {
        if (i === index) {
          const updated = { ...slot, [field]: value };
          
          // Auto-calculate duration when times change
          if (field === 'startTime' || field === 'endTime') {
            const start = new Date(`2000-01-01T${field === 'startTime' ? value : slot.startTime}:00`);
            const end = new Date(`2000-01-01T${field === 'endTime' ? value : slot.endTime}:00`);
            updated.duration = Math.max(0, (end.getTime() - start.getTime()) / 60000);
          }
          
          return updated;
        }
        return slot;
      })
    );
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!selectedCourt) {
      toast.error("Please select a court");
      return;
    }

    // Validate all time slots
    const errors = timeSlots.map((slot, index) => ({
      index,
      error: validateTimeSlot(slot),
    })).filter(item => item.error);

    if (errors.length > 0) {
      toast.error(`Validation errors: ${errors.map(e => `Slot ${e.index + 1}: ${e.error}`).join('; ')}`);
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch('/api/owner/time-slots/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courtId: selectedCourt,
          dayOfWeek: selectedDay,
          timeSlots: timeSlots,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save time slots');
      }

      toast.success('Time slots saved successfully!');
      mutate(); // Refresh the time slots data
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save time slots');
    } finally {
      setIsSaving(false);
    }
  };

  const operatingHours = getOperatingHours(selectedDay);
  const isClosed = !operatingHours || operatingHours.isClosed;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Slot Management
          </DialogTitle>
          <DialogDescription>
            Create and manage time slots for your courts based on operating hours
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Court and Day Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="court">Select Court *</Label>
              <Select value={selectedCourt} onValueChange={setSelectedCourt}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a court" />
                </SelectTrigger>
                <SelectContent>
                  {courts.map((court: any) => (
                    <SelectItem key={court.id} value={court.id}>
                      {court.name} ({court.sport})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="day">Day of Week *</Label>
              <Select value={selectedDay.toString()} onValueChange={(value) => setSelectedDay(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a day" />
                </SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Operating Hours Info */}
          {operatingHours && (
            <Card className={isClosed ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">
                    {daysOfWeek.find(d => d.value === selectedDay)?.name} Operating Hours:
                  </span>
                  {isClosed ? (
                    <Badge variant="destructive">Closed</Badge>
                  ) : (
                    <Badge variant="outline">
                      {operatingHours.openTime} - {operatingHours.closeTime}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {!isClosed && selectedCourt && (
            <>
              {/* Auto-generation Controls */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Auto-Generate Time Slots</CardTitle>
                  <CardDescription>
                    Automatically create time slots based on your preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Start Time</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={autoStartTime}
                        onChange={(e) => setAutoStartTime(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endTime">End Time</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={autoEndTime}
                        onChange={(e) => setAutoEndTime(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (minutes)</Label>
                      <Select value={slotDuration.toString()} onValueChange={(value) => setSlotDuration(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Default Price (₹)</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        value={defaultPrice}
                        onChange={(e) => setDefaultPrice(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <Button onClick={generateTimeSlots} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Generate Time Slots
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Time Slots List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Time Slots</CardTitle>
                      <CardDescription>
                        Manage individual time slots
                      </CardDescription>
                    </div>
                    <Button variant="outline" onClick={addTimeSlot}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Slot
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {timeSlots.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="text-gray-500 mt-2">No time slots configured yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {timeSlots.map((slot, index) => {
                        const validationError = validateTimeSlot(slot);
                        return (
                          <div 
                            key={index} 
                            className={`p-4 border rounded-lg ${validationError ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
                          >
                            <div className="grid grid-cols-4 md:grid-cols-6 gap-4 items-end">
                              <div className="space-y-1">
                                <Label className="text-xs">Start Time</Label>
                                <Input
                                  type="time"
                                  value={slot.startTime}
                                  onChange={(e) => updateTimeSlot(index, 'startTime', e.target.value)}
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">End Time</Label>
                                <Input
                                  type="time"
                                  value={slot.endTime}
                                  onChange={(e) => updateTimeSlot(index, 'endTime', e.target.value)}
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">Duration</Label>
                                <div className="px-3 py-2 text-sm bg-gray-100 rounded">
                                  {slot.duration}m
                                </div>
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">Price (₹)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={slot.price}
                                  onChange={(e) => updateTimeSlot(index, 'price', parseInt(e.target.value) || 0)}
                                />
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">Status</Label>
                                <Select 
                                  value={slot.isActive ? "active" : "inactive"}
                                  onValueChange={(value) => updateTimeSlot(index, 'isActive', value === "active")}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeTimeSlot(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {validationError && (
                              <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                                <AlertCircle className="h-4 w-4" />
                                {validationError}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Save Button */}
              {timeSlots.length > 0 && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Time Slots
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
