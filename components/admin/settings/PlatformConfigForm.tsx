"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";

export function PlatformConfigForm() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Platform Configuration</h3>
        <p className="text-gray-600">Configure platform-wide settings and policies.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="max_courts_per_facility">Max Courts per Facility</Label>
            <Input
              id="max_courts_per_facility"
              type="number"
              defaultValue="20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max_facility_photos">Max Facility Photos</Label>
            <Input
              id="max_facility_photos"
              type="number"
              defaultValue="10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="terms_of_service">Terms of Service</Label>
          <Textarea
            id="terms_of_service"
            rows={6}
            placeholder="Enter terms of service..."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="privacy_policy">Privacy Policy</Label>
          <Textarea
            id="privacy_policy"
            rows={6}
            placeholder="Enter privacy policy..."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button>
          <Save className="w-4 h-4 mr-2" />
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
