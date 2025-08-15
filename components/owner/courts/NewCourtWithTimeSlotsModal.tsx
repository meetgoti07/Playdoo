"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { z } from "zod";
import { Clock, Plus, Trash2, Check, ArrowRight, ArrowLeft, Calendar } from "lucide-react";

interface Facility {
  id: string;
  name: string;
  operatingHours?: Array<{
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  }>;
}

interface NewCourtWithTimeSlotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilities: Facility[];
  onCourtCreated: () => void;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  price: number;
}

const createCourtSchema = z.object({
  facilityId: z.string().min(1, "Please select a facility"),
  name: z.string().min(1, "Court name is required"),
  sportType: z.string().min(1, "Please select a sport type"),
  description: z.string().optional(),
  pricePerHour: z.number().min(0, "Price must be non-negative"),
  capacity: z.number().min(1).optional(),
  length: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  surface: z.string().optional(),
});

export default function NewCourtWithTimeSlotsModal({ 
  isOpen, 
  onClose, 
  facilities, 
  onCourtCreated 
}: NewCourtWithTimeSlotsModalProps) {
  const [currentStep, setCurrentStep] = useState<'court' | 'timeslots'>('court');
  const [createdCourtId, setCreatedCourtId] = useState<string>("");
  const [formData, setFormData] = useState({
    facilityId: "",
    name: "",
    sportType: "",
    description: "",
    pricePerHour: "",
    capacity: "",
    length: "",
    width: "",
    surface: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Time slots state
  const [timeSlotsByDay, setTimeSlotsByDay] = useState<Record<number, TimeSlot[]>>({});
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [autoGenerate, setAutoGenerate] = useState({
    startTime: "09:00",
    endTime: "22:00",
    price: 100,
  });

  const sportTypes = [
    { value: "BADMINTON", label: "Badminton" },
    { value: "TENNIS", label: "Tennis" },
    { value: "FOOTBALL", label: "Football" },
    { value: "BASKETBALL", label: "Basketball" },
    { value: "CRICKET", label: "Cricket" },
    { value: "SQUASH", label: "Squash" },
    { value: "TABLE_TENNIS", label: "Table Tennis" },
    { value: "VOLLEYBALL", label: "Volleyball" },
    { value: "SWIMMING", label: "Swimming" },
    { value: "GYM", label: "Gym" },
    { value: "OTHER", label: "Other" },
  ];

  const surfaces = [
    "Grass", "Concrete", "Wooden", "Synthetic", "Clay", "Rubber", "Tiles", "Other"
  ];

  const daysOfWeek = [
    { value: 0, name: 'Sunday' },
    { value: 1, name: 'Monday' },
    { value: 2, name: 'Tuesday' },
    { value: 3, name: 'Wednesday' },
    { value: 4, name: 'Thursday' },
    { value: 5, name: 'Friday' },
    { value: 6, name: 'Saturday' },
  ];

  const selectedFacility = facilities.find(f => f.id === formData.facilityId);

  const getOperatingHours = (dayOfWeek: number) => {
    if (!selectedFacility?.operatingHours) return null;
    return selectedFacility.operatingHours.find(oh => oh.dayOfWeek === dayOfWeek);
  };

  const handleClose = () => {
    setCurrentStep('court');
    setCreatedCourtId("");
    setFormData({
      facilityId: "",
      name: "",
      sportType: "",
      description: "",
      pricePerHour: "",
      capacity: "",
      length: "",
      width: "",
      surface: "",
    });
    setTimeSlotsByDay({});
    setErrors({});
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleCourtSubmit = async () => {
    setIsSubmitting(true);
    setErrors({});

    try {
      // Prepare data for validation
      const dataToValidate = {
        ...formData,
        pricePerHour: formData.pricePerHour ? parseFloat(formData.pricePerHour) : 0,
        capacity: formData.capacity ? parseInt(formData.capacity) : undefined,
        length: formData.length ? parseFloat(formData.length) : undefined,
        width: formData.width ? parseFloat(formData.width) : undefined,
        description: formData.description || undefined,
        surface: formData.surface || undefined,
      };

      // Validate the data
      const validatedData = createCourtSchema.parse(dataToValidate);

      const response = await fetch('/api/owner/courts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create court');
      }

      const result = await response.json();
      setCreatedCourtId(result.court.id);
      toast.success('Court created successfully! Now set up time slots.');
      setCurrentStep('timeslots');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path && err.path.length > 0) {
            fieldErrors[String(err.path[0])] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to create court');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateTimeSlots = (dayOfWeek: number) => {
    const operatingHours = getOperatingHours(dayOfWeek);
    if (!operatingHours || operatingHours.isClosed) {
      toast.error("Facility is closed on this day");
      return;
    }

    const facilityStart = new Date(`2000-01-01T${operatingHours.openTime}:00`);
    const facilityEnd = new Date(`2000-01-01T${operatingHours.closeTime}:00`);
    const userStart = new Date(`2000-01-01T${autoGenerate.startTime}:00`);
    const userEnd = new Date(`2000-01-01T${autoGenerate.endTime}:00`);

    // Use the more restrictive time range
    const effectiveStart = userStart > facilityStart ? userStart : facilityStart;
    const effectiveEnd = userEnd < facilityEnd ? userEnd : facilityEnd;

    const slots: TimeSlot[] = [];
    let currentTime = new Date(effectiveStart);

    while (currentTime < effectiveEnd) {
      const endTime = new Date(currentTime.getTime() + 60 * 60000); // 1 hour slots
      
      if (endTime <= effectiveEnd) {
        slots.push({
          startTime: currentTime.toTimeString().slice(0, 5),
          endTime: endTime.toTimeString().slice(0, 5),
          price: autoGenerate.price,
        });
      }
      
      currentTime = endTime;
    }

    setTimeSlotsByDay(prev => ({
      ...prev,
      [dayOfWeek]: slots
    }));

    toast.success(`Generated ${slots.length} time slots for ${daysOfWeek.find(d => d.value === dayOfWeek)?.name}`);
  };

  const handleTimeSlotsSubmit = async () => {
    setIsSubmitting(true);

    try {
      const allSlots = Object.entries(timeSlotsByDay).flatMap(([dayOfWeek, slots]) =>
        slots.map(slot => ({ ...slot, dayOfWeek: parseInt(dayOfWeek) }))
      );

      if (allSlots.length === 0) {
        toast.error("Please add at least one time slot");
        return;
      }

      // Group by day and save each day separately
      const groupedSlots = Object.entries(timeSlotsByDay);
      
      // Get next 7 days starting from tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      for (const [dayOfWeek, slots] of groupedSlots) {
        if (slots.length > 0) {
          // Find the next occurrence of this day of week
          const targetDate = new Date(tomorrow);
          const daysDiff = (parseInt(dayOfWeek) - targetDate.getDay() + 7) % 7;
          targetDate.setDate(targetDate.getDate() + daysDiff);
          
          const response = await fetch('/api/owner/time-slots/bulk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              courtId: createdCourtId,
              date: targetDate.toISOString().split('T')[0], // YYYY-MM-DD format
              timeSlots: slots.map(slot => ({
                startTime: slot.startTime,
                endTime: slot.endTime,
                price: slot.price,
              })),
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to save time slots for ${daysOfWeek.find(d => d.value === parseInt(dayOfWeek))?.name}`);
          }
        }
      }

      toast.success('Court and time slots created successfully!');
      onCourtCreated();
      handleClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save time slots');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTimeSlot = (dayOfWeek: number) => {
    const newSlot: TimeSlot = {
      startTime: "09:00",
      endTime: "10:00",
      price: autoGenerate.price,
    };

    setTimeSlotsByDay(prev => ({
      ...prev,
      [dayOfWeek]: [...(prev[dayOfWeek] || []), newSlot]
    }));
  };

  const updateTimeSlot = (dayOfWeek: number, index: number, field: keyof TimeSlot, value: any) => {
    setTimeSlotsByDay(prev => ({
      ...prev,
      [dayOfWeek]: (prev[dayOfWeek] || []).map((slot, i) => {
        if (i === index) {
          const updated = { ...slot, [field]: value };
          return updated;
        }
        return slot;
      })
    }));
  };

  const removeTimeSlot = (dayOfWeek: number, index: number) => {
    setTimeSlotsByDay(prev => ({
      ...prev,
      [dayOfWeek]: (prev[dayOfWeek] || []).filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="overflow-y-auto w-[95vw] max-w-[80vw] sm:max-w-[80vw] md:max-w-[80vw] lg:max-w-[80vw] xl:max-w-[80vw] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentStep === 'court' ? (
              <>
                <Calendar className="h-5 w-5" />
                Add New Court - Step 1
              </>
            ) : (
              <>
                <Clock className="h-5 w-5" />
                Set Up Time Slots - Step 2
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {currentStep === 'court' 
              ? "Create a new court for your facility. Fill in the details below."
              : "Configure time slots for your new court based on facility operating hours."
            }
          </DialogDescription>
        </DialogHeader>

        {currentStep === 'court' ? (
          // Court Creation Form
          <form onSubmit={(e) => { e.preventDefault(); handleCourtSubmit(); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Facility Selection */}
              <div className="space-y-2">
                <Label htmlFor="facilityId">Facility *</Label>
                <Select 
                  value={formData.facilityId || undefined} 
                  onValueChange={(value) => handleInputChange("facilityId", value)}
                >
                  <SelectTrigger className={errors.facilityId ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select facility" />
                  </SelectTrigger>
                  <SelectContent>
                    {facilities.map((facility) => (
                      <SelectItem key={facility.id} value={facility.id}>
                        {facility.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.facilityId && <p className="text-sm text-red-500">{errors.facilityId}</p>}
              </div>

              {/* Court Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Court Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Court 1, Main Court"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>

              {/* Sport Type */}
              <div className="space-y-2">
                <Label htmlFor="sportType">Sport Type *</Label>
                <Select 
                  value={formData.sportType || undefined} 
                  onValueChange={(value) => handleInputChange("sportType", value)}
                >
                  <SelectTrigger className={errors.sportType ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select sport type" />
                  </SelectTrigger>
                  <SelectContent>
                    {sportTypes.map((sport) => (
                      <SelectItem key={sport.value} value={sport.value}>
                        {sport.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.sportType && <p className="text-sm text-red-500">{errors.sportType}</p>}
              </div>

              {/* Price Per Hour */}
              <div className="space-y-2">
                <Label htmlFor="pricePerHour">Price Per Hour (₹) *</Label>
                <Input
                  id="pricePerHour"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.pricePerHour}
                  onChange={(e) => handleInputChange("pricePerHour", e.target.value)}
                  placeholder="e.g., 500"
                  className={errors.pricePerHour ? "border-red-500" : ""}
                />
                {errors.pricePerHour && <p className="text-sm text-red-500">{errors.pricePerHour}</p>}
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (Players)</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => handleInputChange("capacity", e.target.value)}
                  placeholder="e.g., 4"
                />
              </div>

              {/* Surface Type */}
              <div className="space-y-2">
                <Label htmlFor="surface">Surface Type</Label>
                <Select 
                  value={formData.surface || undefined} 
                  onValueChange={(value) => handleInputChange("surface", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select surface type" />
                  </SelectTrigger>
                  <SelectContent>
                    {surfaces.map((surface) => (
                      <SelectItem key={surface} value={surface.toLowerCase()}>
                        {surface}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Length */}
              <div className="space-y-2">
                <Label htmlFor="length">Length (meters)</Label>
                <Input
                  id="length"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.length}
                  onChange={(e) => handleInputChange("length", e.target.value)}
                  placeholder="e.g., 20"
                />
              </div>

              {/* Width */}
              <div className="space-y-2">
                <Label htmlFor="width">Width (meters)</Label>
                <Input
                  id="width"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.width}
                  onChange={(e) => handleInputChange("width", e.target.value)}
                  placeholder="e.g., 10"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Optional description of the court..."
                rows={3}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : (
                  <>
                    Create Court & Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          // Time Slots Setup
          <div className="space-y-6">
            {/* Auto-generation Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Auto-Generate Time Slots</CardTitle>
                <CardDescription>
                  Set default parameters for generating time slots
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={autoGenerate.startTime}
                      onChange={(e) => setAutoGenerate(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={autoGenerate.endTime}
                      onChange={(e) => setAutoGenerate(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Default Price (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={autoGenerate.price}
                      onChange={(e) => setAutoGenerate(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Days Tabs */}
            <Tabs value={selectedDay.toString()} onValueChange={(value) => setSelectedDay(parseInt(value))}>
              <TabsList className="grid w-full grid-cols-7">
                {daysOfWeek.map((day) => (
                  <TabsTrigger key={day.value} value={day.value.toString()}>
                    {day.name.slice(0, 3)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {daysOfWeek.map((day) => {
                const operatingHours = getOperatingHours(day.value);
                const daySlots = timeSlotsByDay[day.value] || [];

                return (
                  <TabsContent key={day.value} value={day.value.toString()} className="space-y-4">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>{day.name}</CardTitle>
                            <CardDescription>
                              {operatingHours && !operatingHours.isClosed ? (
                                `Operating Hours: ${operatingHours.openTime} - ${operatingHours.closeTime}`
                              ) : (
                                "Facility is closed on this day"
                              )}
                            </CardDescription>
                          </div>
                          {operatingHours && !operatingHours.isClosed && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => generateTimeSlots(day.value)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Auto Generate
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addTimeSlot(day.value)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Slot
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {operatingHours && operatingHours.isClosed ? (
                          <div className="text-center py-8 text-gray-500">
                            Facility is closed on {day.name}
                          </div>
                        ) : daySlots.length === 0 ? (
                          <div className="text-center py-8">
                            <Clock className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="text-gray-500 mt-2">No time slots configured yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {daySlots.map((slot, index) => (
                              <div key={index} className="p-4 border rounded-lg">
                                <div className="grid grid-cols-4 md:grid-cols-6 gap-4 items-end">
                                  <div className="space-y-1">
                                    <Label className="text-xs">Start Time</Label>
                                    <Input
                                      type="time"
                                      value={slot.startTime}
                                      onChange={(e) => updateTimeSlot(day.value, index, 'startTime', e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">End Time</Label>
                                    <Input
                                      type="time"
                                      value={slot.endTime}
                                      onChange={(e) => updateTimeSlot(day.value, index, 'endTime', e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-xs">Price (₹)</Label>
                                    <Input
                                      type="number"
                                      min="0"
                                      value={slot.price}
                                      onChange={(e) => updateTimeSlot(day.value, index, 'price', parseInt(e.target.value) || 0)}
                                    />
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeTimeSlot(day.value, index)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                );
              })}
            </Tabs>

            {/* Navigation Actions */}
            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('court')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Court Details
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Skip & Finish
                </Button>
                <Button onClick={handleTimeSlotsSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Save Court & Time Slots
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
