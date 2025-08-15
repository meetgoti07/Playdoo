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
import { Clock, Plus, Trash2, Check, ArrowRight, ArrowLeft } from "lucide-react";

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

interface NewCourtModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilities: Facility[];
  onCourtCreated: () => void;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  duration: number;
  price: number;
  dayOfWeek: number;
  isActive: boolean;
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

export default function NewCourtModal({ isOpen, onClose, facilities, onCourtCreated }: NewCourtModalProps) {
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
    duration: 60,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        if (errorData.details) {
          // Handle Zod validation errors
          const fieldErrors: Record<string, string> = {};
          errorData.details.forEach((error: any) => {
            if (error.path) {
              fieldErrors[error.path[0]] = error.message;
            }
          });
          setErrors(fieldErrors);
          return;
        }
        throw new Error(errorData.message || 'Failed to create court');
      }

      toast.success('Court created successfully');
      onCourtCreated();
      handleReset();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path) {
            fieldErrors[err.path[0] as string] = err.message;
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

  const handleReset = () => {
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
    setErrors({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Court</DialogTitle>
          <DialogDescription>
            Create a new court for your facility. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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
                className={errors.capacity ? "border-red-500" : ""}
              />
              {errors.capacity && <p className="text-sm text-red-500">{errors.capacity}</p>}
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
                className={errors.length ? "border-red-500" : ""}
              />
              {errors.length && <p className="text-sm text-red-500">{errors.length}</p>}
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
                className={errors.width ? "border-red-500" : ""}
              />
              {errors.width && <p className="text-sm text-red-500">{errors.width}</p>}
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
              {isSubmitting ? "Creating..." : "Create Court"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
