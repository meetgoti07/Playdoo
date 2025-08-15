"use client";

import { useState } from "react";
import { useSystemSettings, updateSetting, bulkUpdateSettings, DEFAULT_SETTINGS } from "@/hooks/swr/admin/useSystemSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, RefreshCw, Shield, Mail, CreditCard, Bell, Globe, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: settings, isLoading, error, mutate } = useSystemSettings();
  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSettingChange = (key: string, value: any, dataType: string) => {
    setUnsavedChanges(prev => ({
      ...prev,
      [key]: { value, dataType }
    }));
  };

  const handleSaveSettings = async () => {
    if (Object.keys(unsavedChanges).length === 0) {
      toast.info("No changes to save");
      return;
    }

    setIsSubmitting(true);
    try {
      const settingsToUpdate = Object.entries(unsavedChanges).map(([key, data]) => ({
        key,
        value: data.value,
        dataType: data.dataType,
      }));

      await bulkUpdateSettings(settingsToUpdate);
      toast.success("Settings updated successfully");
      setUnsavedChanges({});
      mutate();
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!confirm("Are you sure you want to reset all settings to default values?")) return;

    setIsSubmitting(true);
    try {
      const defaultSettingsFlat = Object.values(DEFAULT_SETTINGS).flat();
      await bulkUpdateSettings(defaultSettingsFlat);
      toast.success("Settings reset to defaults");
      setUnsavedChanges({});
      mutate();
    } catch (error) {
      toast.error("Failed to reset settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentValue = (key: string, originalValue: any) => {
    return unsavedChanges[key]?.value ?? originalValue;
  };

  const renderSettingInput = (setting: any) => {
    const currentValue = getCurrentValue(setting.key, setting.parsedValue);

    switch (setting.dataType) {
      case "boolean":
        return (
          <Switch
            checked={currentValue}
            onCheckedChange={(checked) => handleSettingChange(setting.key, checked, "boolean")}
          />
        );
      
      case "number":
        return (
          <Input
            type="number"
            value={currentValue || ""}
            onChange={(e) => handleSettingChange(setting.key, parseFloat(e.target.value), "number")}
            className="max-w-xs"
          />
        );
      
      case "json":
        return (
          <Textarea
            value={typeof currentValue === "object" ? JSON.stringify(currentValue, null, 2) : currentValue}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleSettingChange(setting.key, parsed, "json");
              } catch {
                handleSettingChange(setting.key, e.target.value, "json");
              }
            }}
            rows={4}
            className="font-mono text-sm"
          />
        );
      
      default:
        return (
          <Input
            value={currentValue || ""}
            onChange={(e) => handleSettingChange(setting.key, e.target.value, "string")}
            className="max-w-md"
          />
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      general: Globe,
      booking: RefreshCw,
      payments: CreditCard,
      notifications: Bell,
      security: Shield,
      email: Mail,
    };
    
    return icons[category] || Globe;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: "bg-blue-100 text-blue-800",
      booking: "bg-green-100 text-green-800",
      payments: "bg-purple-100 text-purple-800",
      notifications: "bg-yellow-100 text-yellow-800",
      security: "bg-red-100 text-red-800",
      email: "bg-indigo-100 text-indigo-800",
    };
    
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        Failed to load system settings
      </div>
    );
  }

  const hasUnsavedChanges = Object.keys(unsavedChanges).length > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-2">
            Configure platform-wide settings and preferences
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={handleResetDefaults} disabled={isSubmitting}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSaveSettings} disabled={!hasUnsavedChanges || isSubmitting}>
            <Save className="w-4 h-4 mr-2" />
            {isSubmitting ? "Saving..." : "Save Changes"}
            {hasUnsavedChanges && (
              <Badge variant="destructive" className="ml-2">
                {Object.keys(unsavedChanges).length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Unsaved Changes Alert */}
      {hasUnsavedChanges && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
          <div className="flex-1">
            <p className="text-yellow-800 font-medium">You have unsaved changes</p>
            <p className="text-yellow-700 text-sm">
              {Object.keys(unsavedChanges).length} setting(s) modified. Don't forget to save your changes.
            </p>
          </div>
        </div>
      )}

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          {Object.keys(settings || {}).map((category) => {
            const Icon = getCategoryIcon(category);
            return (
              <TabsTrigger key={category} value={category} className="flex items-center space-x-2">
                <Icon className="w-4 h-4" />
                <span className="capitalize">{category}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {Object.entries(settings || {}).map(([category, categorySettings]) => (
          <TabsContent key={category} value={category}>
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  {(() => {
                    const Icon = getCategoryIcon(category);
                    return <Icon className="w-6 h-6" />;
                  })()}
                  <div>
                    <CardTitle className="capitalize">{category} Settings</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      Configure {category} related preferences and options
                    </p>
                  </div>
                  <Badge className={getCategoryColor(category)}>
                    {categorySettings.length} settings
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {categorySettings.map((setting: any, index: number) => (
                    <div key={setting.key}>
                      <div className="flex justify-between items-start space-x-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Label htmlFor={setting.key} className="text-base font-medium">
                              {setting.key.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </Label>
                            {setting.isPublic && (
                              <Badge variant="outline" className="text-xs">
                                Public
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {setting.dataType}
                            </Badge>
                          </div>
                          
                          {/* Setting description from defaults */}
                          {DEFAULT_SETTINGS[category]?.find((s: any) => s.key === setting.key)?.description && (
                            <p className="text-sm text-gray-600">
                              {DEFAULT_SETTINGS[category].find((s: any) => s.key === setting.key)?.description}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex-shrink-0">
                          {renderSettingInput(setting)}
                        </div>
                      </div>
                      
                      {/* Show current vs modified indicator */}
                      {unsavedChanges[setting.key] && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Original:</span>
                            <span className="font-mono">
                              {typeof setting.parsedValue === "object" 
                                ? JSON.stringify(setting.parsedValue) 
                                : String(setting.parsedValue)
                              }
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-600">Modified:</span>
                            <span className="font-mono text-blue-600">
                              {typeof unsavedChanges[setting.key].value === "object"
                                ? JSON.stringify(unsavedChanges[setting.key].value)
                                : String(unsavedChanges[setting.key].value)
                              }
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {index < categorySettings.length - 1 && <Separator className="mt-6" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Help Text */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Settings Help</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Data Types:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li><span className="font-mono">string</span> - Text values</li>
                  <li><span className="font-mono">number</span> - Numeric values</li>
                  <li><span className="font-mono">boolean</span> - True/false values</li>
                  <li><span className="font-mono">json</span> - Complex data structures</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Important Notes:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Changes are not applied until you save</li>
                  <li>• Public settings may be visible to users</li>
                  <li>• Some changes may require application restart</li>
                  <li>• Always backup before making major changes</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
