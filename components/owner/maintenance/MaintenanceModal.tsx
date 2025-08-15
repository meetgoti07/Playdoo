"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface MaintenanceModalProps {
  onMaintenanceCreated?: () => void;
}

export function MaintenanceModal({ onMaintenanceCreated }: MaintenanceModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    courtId: "",
    title: "",
    description: "",
    startDate: "",
    endDate: "",
  });

  // Get courts for selection
  const { data: courtsData } = useSWR("/api/owner/courts", fetcher);
  const courts = courtsData?.courts || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.courtId || !formData.title || !formData.startDate || !formData.endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error("End date must be after start date");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/owner/maintenance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Maintenance record created successfully");
        setFormData({
          courtId: "",
          title: "",
          description: "",
          startDate: "",
          endDate: "",
        });
        setIsOpen(false);
        
        // Revalidate maintenance data cache
        mutate("/api/owner/maintenance");
        
        // Call the callback if provided
        onMaintenanceCreated?.();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create maintenance record");
      }
    } catch (error) {
      console.error("Error creating maintenance:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Maintenance
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Maintenance</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="court">Court *</Label>
            <Select value={formData.courtId} onValueChange={(value) => setFormData({...formData, courtId: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select court" />
              </SelectTrigger>
              <SelectContent>
                {courts.map((court: any) => (
                  <SelectItem key={court.id} value={court.id}>
                    {court.facility.name} - {court.name} ({court.sportType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g., Court Resurfacing, Net Replacement"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Detailed description of maintenance work..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                min={today}
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                min={formData.startDate || today}
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Maintenance"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
