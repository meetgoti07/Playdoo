"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SystemSetting {
  key: string;
  value: string;
  dataType: string;
  category: string;
}

export function SystemSettingsForm() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/admin/settings");
      if (response.ok) {
        const data = await response.json();
        const settingsMap: Record<string, string> = {};
        data.forEach((setting: SystemSetting) => {
          settingsMap[setting.key] = setting.value;
        });
        setSettings(settingsMap);
      }
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success("Settings saved successfully");
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Platform Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Platform Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="platform_name">Platform Name</Label>
            <Input
              id="platform_name"
              value={settings.platform_name || "QuickCourt"}
              onChange={(e) => updateSetting("platform_name", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="platform_tagline">Platform Tagline</Label>
            <Input
              id="platform_tagline"
              value={settings.platform_tagline || "Book Sports Facilities Instantly"}
              onChange={(e) => updateSetting("platform_tagline", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="platform_description">Platform Description</Label>
          <Textarea
            id="platform_description"
            value={settings.platform_description || ""}
            onChange={(e) => updateSetting("platform_description", e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <Separator />

      {/* Business Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Business Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="platform_commission">Platform Commission (%)</Label>
            <Input
              id="platform_commission"
              type="number"
              min="0"
              max="100"
              value={settings.platform_commission || "10"}
              onChange={(e) => updateSetting("platform_commission", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cancellation_window">Cancellation Window (hours)</Label>
            <Input
              id="cancellation_window"
              type="number"
              min="0"
              value={settings.cancellation_window || "24"}
              onChange={(e) => updateSetting("cancellation_window", e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="booking_advance_days">Booking Advance Days</Label>
            <Input
              id="booking_advance_days"
              type="number"
              min="1"
              value={settings.booking_advance_days || "30"}
              onChange={(e) => updateSetting("booking_advance_days", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minimum_booking_amount">Minimum Booking Amount (₹)</Label>
            <Input
              id="minimum_booking_amount"
              type="number"
              min="0"
              value={settings.minimum_booking_amount || "100"}
              onChange={(e) => updateSetting("minimum_booking_amount", e.target.value)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Feature Toggles */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Feature Toggles</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enable_reviews">Enable Reviews</Label>
              <p className="text-sm text-gray-500">Allow users to review facilities</p>
            </div>
            <Switch
              id="enable_reviews"
              checked={settings.enable_reviews === "true"}
              onCheckedChange={(checked) => updateSetting("enable_reviews", checked.toString())}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enable_notifications">Enable Notifications</Label>
              <p className="text-sm text-gray-500">Send email and SMS notifications</p>
            </div>
            <Switch
              id="enable_notifications"
              checked={settings.enable_notifications === "true"}
              onCheckedChange={(checked) => updateSetting("enable_notifications", checked.toString())}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto_approve_facilities">Auto Approve Facilities</Label>
              <p className="text-sm text-gray-500">Automatically approve new facility registrations</p>
            </div>
            <Switch
              id="auto_approve_facilities"
              checked={settings.auto_approve_facilities === "true"}
              onCheckedChange={(checked) => updateSetting("auto_approve_facilities", checked.toString())}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="maintenance_mode">Maintenance Mode</Label>
              <p className="text-sm text-gray-500">Put the platform in maintenance mode</p>
            </div>
            <Switch
              id="maintenance_mode"
              checked={settings.maintenance_mode === "true"}
              onCheckedChange={(checked) => updateSetting("maintenance_mode", checked.toString())}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="support_email">Support Email</Label>
            <Input
              id="support_email"
              type="email"
              value={settings.support_email || "support@quickcourt.com"}
              onChange={(e) => updateSetting("support_email", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support_phone">Support Phone</Label>
            <Input
              id="support_phone"
              value={settings.support_phone || "+91 9999999999"}
              onChange={(e) => updateSetting("support_phone", e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
