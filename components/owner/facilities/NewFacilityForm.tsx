"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FacilityImageUpload, FacilityImage } from "./FacilityImageUpload";
import { toast } from "sonner";
import { Building2, MapPin, Phone, Mail, Globe, Save, Camera, Clock, Star, X } from "lucide-react";

interface FacilityFormData {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  venueType: string;
  latitude?: number;
  longitude?: number;
  amenities: string[];
  images: FacilityImage[];
  operatingHours: OperatingHour[];
}

interface OperatingHour {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

interface Amenity {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export function NewFacilityForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [availableAmenities, setAvailableAmenities] = useState<Amenity[]>([]);
  
  const daysOfWeek = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
  ];

  const [formData, setFormData] = useState<FacilityFormData>({
    name: "",
    description: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    phone: "",
    email: "",
    website: "",
    venueType: "",
    amenities: [],
    images: [],
    operatingHours: daysOfWeek.map(day => ({
      dayOfWeek: day.value,
      openTime: "09:00",
      closeTime: "21:00",
      isClosed: false,
    })),
  });

  // Fetch available amenities
  useEffect(() => {
    const fetchAmenities = async () => {
      try {
        const response = await fetch("/api/amenities");
        if (response.ok) {
          const data = await response.json();
          setAvailableAmenities(data.amenities || []);
        }
      } catch (error) {
        console.error("Error fetching amenities:", error);
      }
    };

    fetchAmenities();
  }, []);

  const handleInputChange = (field: keyof FacilityFormData, value: string | number | string[] | FacilityImage[] | OperatingHour[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAmenityToggle = (amenityId: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId],
    }));
  };

  const handleImagesChange = (images: FacilityImage[]) => {
    setFormData(prev => ({
      ...prev,
      images,
    }));
  };

  const handleOperatingHourChange = (dayIndex: number, field: keyof OperatingHour, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      operatingHours: prev.operatingHours.map((hour, index) =>
        index === dayIndex ? { ...hour, [field]: value } : hour
      ),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that all images are uploaded
    const hasUnuploadedImages = formData.images.some(img => !img.uploaded);
    if (hasUnuploadedImages) {
      toast.error("Please upload all images before submitting the form");
      return;
    }
    
    setLoading(true);

    try {
      // Prepare the data for submission
      const submitData = {
        ...formData,
        // Extract URLs from uploaded images
        imageUrls: formData.images.map(img => img.url).filter(Boolean),
      };
      
      // Remove the images array as we're sending URLs instead
      const { images, ...dataToSubmit } = submitData;

      const response = await fetch("/api/owner/facilities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Facility registered successfully! Awaiting admin approval.");
        router.push(`/owner/facilities/${data.facility.id}`);
      } else {
        const error = await response.text();
        toast.error(error || "Failed to register facility");
      }
    } catch (error) {
      console.error("Error registering facility:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Basic Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Facility Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter facility name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="venueType">Venue Type *</Label>
              <Select value={formData.venueType} onValueChange={(value) => handleInputChange("venueType", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select venue type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDOOR">Indoor</SelectItem>
                  <SelectItem value="OUTDOOR">Outdoor</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe your facility, amenities, and features"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Location Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Location Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="address">Full Address *</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Enter complete address"
              rows={3}
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="City"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                placeholder="State"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                placeholder="Country"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="pincode">Pincode *</Label>
              <Input
                id="pincode"
                value={formData.pincode}
                onChange={(e) => handleInputChange("pincode", e.target.value)}
                placeholder="Pincode"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude (Optional)</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude || ""}
                onChange={(e) => handleInputChange("latitude", parseFloat(e.target.value) || 0)}
                placeholder="Enter latitude"
              />
            </div>
            
            <div>
              <Label htmlFor="longitude">Longitude (Optional)</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude || ""}
                onChange={(e) => handleInputChange("longitude", parseFloat(e.target.value) || 0)}
                placeholder="Enter longitude"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Phone className="h-5 w-5" />
            <span>Contact Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter phone number"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="website">Website (Optional)</Label>
            <Input
              id="website"
              value={formData.website}
              onChange={(e) => handleInputChange("website", e.target.value)}
              placeholder="https://your-website.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Facility Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>Facility Photos</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FacilityImageUpload
            onImagesChange={handleImagesChange}
            maxImages={10}
            maxSize={10}
          />
        </CardContent>
      </Card>

      {/* Amenities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Star className="h-5 w-5" />
            <span>Amenities & Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Select Available Amenities</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
              {availableAmenities.map((amenity) => (
                <div key={amenity.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`amenity-${amenity.id}`}
                    checked={formData.amenities.includes(amenity.id)}
                    onCheckedChange={() => handleAmenityToggle(amenity.id)}
                  />
                  <Label
                    htmlFor={`amenity-${amenity.id}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {amenity.name}
                  </Label>
                </div>
              ))}
            </div>
            {availableAmenities.length === 0 && (
              <p className="text-sm text-gray-500">
                Loading amenities...
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Operating Hours</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Set operating hours for each day</Label>
            <div className="space-y-4 mt-2">
              {daysOfWeek.map((day, index) => (
                <div key={day.value} className="flex items-center space-x-4">
                  <div className="w-24">
                    <Label className="text-sm font-medium">{day.label}</Label>
                  </div>
                  
                  <Checkbox
                    checked={!formData.operatingHours[index].isClosed}
                    onCheckedChange={(checked) =>
                      handleOperatingHourChange(index, 'isClosed', !checked)
                    }
                  />
                  <Label className="text-sm">Open</Label>
                  
                  {!formData.operatingHours[index].isClosed && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="time"
                          value={formData.operatingHours[index].openTime}
                          onChange={(e) =>
                            handleOperatingHourChange(index, 'openTime', e.target.value)
                          }
                          className="w-32"
                        />
                        <span className="text-sm text-gray-500">to</span>
                        <Input
                          type="time"
                          value={formData.operatingHours[index].closeTime}
                          onChange={(e) =>
                            handleOperatingHourChange(index, 'closeTime', e.target.value)
                          }
                          className="w-32"
                        />
                      </div>
                    </>
                  )}
                  
                  {formData.operatingHours[index].isClosed && (
                    <span className="text-sm text-gray-500 italic">Closed</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        
        <Button type="submit" disabled={loading}>
          {loading ? (
            "Registering..."
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Register Facility
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
