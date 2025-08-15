"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { blockTimeSlot } from "@/hooks/swr/schedule/useOwnerSchedule";
import type { Facility } from "@/hooks/swr/schedule/useOwnerSchedule";

interface BlockSlotDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilities: Facility[];
  selectedDate?: string;
  selectedCourt?: string;
  onSuccess: () => void;
}

export function BlockSlotDialog({
  open,
  onOpenChange,
  facilities,
  selectedDate,
  selectedCourt,
  onSuccess,
}: BlockSlotDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    courtId: selectedCourt || "",
    date: selectedDate || "",
    startTime: "",
    endTime: "",
    blockReason: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.courtId || !formData.date || !formData.startTime || !formData.endTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate time range
    if (formData.startTime >= formData.endTime) {
      toast.error("End time must be after start time");
      return;
    }

    setLoading(true);
    try {
      await blockTimeSlot(formData);
      toast.success("Time slot blocked successfully");
      onSuccess();
      onOpenChange(false);
      setFormData({
        courtId: "",
        date: "",
        startTime: "",
        endTime: "",
        blockReason: "",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to block time slot");
    } finally {
      setLoading(false);
    }
  };

  const getAllCourts = () => {
    return facilities.flatMap(facility => 
      facility.courts.map(court => ({
        ...court,
        facilityName: facility.name,
      }))
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Block Time Slot
          </DialogTitle>
          <DialogDescription>
            Block a time slot to prevent bookings during maintenance or other activities.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="court">Court *</Label>
            <Select
              value={formData.courtId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, courtId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a court" />
              </SelectTrigger>
              <SelectContent>
                {getAllCourts().map((court) => (
                  <SelectItem key={court.id} value={court.id}>
                    {court.facilityName} - {court.name} ({court.sportType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Block Reason</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Maintenance work, Private event, etc."
              value={formData.blockReason}
              onChange={(e) => setFormData(prev => ({ ...prev, blockReason: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Block Time Slot
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
