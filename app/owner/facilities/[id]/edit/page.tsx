"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";

const facilityEditSchema = z.object({
  name: z.string().min(1, "Facility name is required").max(100),
  description: z.string().optional(),
  address: z.string().min(1, "Address is required").max(255),
  city: z.string().min(1, "City is required").max(100),
  state: z.string().min(1, "State is required").max(100),
  pincode: z.string().min(1, "Pincode is required").max(10),
  country: z.string().min(1, "Country is required").max(100),
  phone: z.string().min(1, "Phone is required").max(20),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  venueType: z.enum(["INDOOR", "OUTDOOR", "BOTH"]),
});

type FacilityEditForm = z.infer<typeof facilityEditSchema>;

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function FacilityEditPage() {
  const params = useParams();
  const router = useRouter();
  const facilityId = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: facilityData, isLoading, error, mutate } = useSWR(
    `/api/owner/facilities/${facilityId}`,
    fetcher
  );
  const facility = facilityData?.facility;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FacilityEditForm>({
    resolver: zodResolver(facilityEditSchema),
    defaultValues: facility ? {
      name: facility.name,
      description: facility.description || "",
      address: facility.address,
      city: facility.city,
      state: facility.state,
      pincode: facility.pincode,
      country: facility.country,
      phone: facility.phone,
      email: facility.email || "",
      website: facility.website || "",
      venueType: facility.venueType as "INDOOR" | "OUTDOOR" | "BOTH",
    } : undefined,
  });

  const venueType = watch("venueType");

  // Update form values when facility data loads
  useEffect(() => {
    if (facility) {
      setValue("name", facility.name);
      setValue("description", facility.description || "");
      setValue("address", facility.address);
      setValue("city", facility.city);
      setValue("state", facility.state);
      setValue("pincode", facility.pincode);
      setValue("country", facility.country);
      setValue("phone", facility.phone);
      setValue("email", facility.email || "");
      setValue("website", facility.website || "");
      setValue("venueType", facility.venueType as "INDOOR" | "OUTDOOR" | "BOTH");
    }
  }, [facility, setValue]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Facility Not Found</h3>
              <p className="text-gray-600 mb-4">
                The facility you're looking for doesn't exist or you don't have access to it.
              </p>
              <Button onClick={() => router.push('/owner/facilities')}>
                Back to Facilities
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = async (data: FacilityEditForm) => {
    try {
      setIsSubmitting(true);
      
      globalThis?.logger?.info({
        meta: {
          requestId: crypto.randomUUID(),
          facilityId: facilityId,
          action: "facility_edit_attempt"
        },
        message: 'Attempting to update facility.',
      });

      const response = await fetch(`/api/owner/facilities/${facilityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update facility');
      }

      const result = await response.json();
      
      globalThis?.logger?.info({
        meta: {
          requestId: crypto.randomUUID(),
          facilityId: facilityId,
          action: "facility_updated"
        },
        message: 'Facility updated successfully.',
      });

      toast.success('Facility updated successfully!');
      mutate(); // Refresh the facility data
      router.push(`/owner/facilities/${facilityId}`);
    } catch (error) {
      globalThis?.logger?.error({
        err: error,
        meta: {
          facilityId: facilityId,
          action: "facility_update_error"
        },
        message: 'Failed to update facility.',
      });

      toast.error(error instanceof Error ? error.message : 'Failed to update facility');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push(`/owner/facilities/${facilityId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Facility
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Facility</h1>
          <p className="text-gray-600">Update your facility information</p>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Update the basic details of your facility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Facility Name *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Enter facility name"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="venueType">Venue Type *</Label>
                <Select
                  value={venueType}
                  onValueChange={(value) => setValue("venueType", value as "INDOOR" | "OUTDOOR" | "BOTH")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select venue type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INDOOR">Indoor</SelectItem>
                    <SelectItem value="OUTDOOR">Outdoor</SelectItem>
                    <SelectItem value="BOTH">Both Indoor & Outdoor</SelectItem>
                  </SelectContent>
                </Select>
                {errors.venueType && (
                  <p className="text-sm text-red-600">{errors.venueType.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe your facility..."
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location Details</CardTitle>
            <CardDescription>
              Update the address and location information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                {...register("address")}
                placeholder="Enter complete address"
                rows={2}
              />
              {errors.address && (
                <p className="text-sm text-red-600">{errors.address.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  {...register("city")}
                  placeholder="City"
                />
                {errors.city && (
                  <p className="text-sm text-red-600">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  {...register("state")}
                  placeholder="State"
                />
                {errors.state && (
                  <p className="text-sm text-red-600">{errors.state.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  {...register("pincode")}
                  placeholder="Pincode"
                />
                {errors.pincode && (
                  <p className="text-sm text-red-600">{errors.pincode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  {...register("country")}
                  placeholder="Country"
                />
                {errors.country && (
                  <p className="text-sm text-red-600">{errors.country.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
            <CardDescription>
              Update contact details for your facility
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="Phone number"
                  type="tel"
                />
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  {...register("email")}
                  placeholder="Email address"
                  type="email"
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                {...register("website")}
                placeholder="https://yourwebsite.com"
                type="url"
              />
              {errors.website && (
                <p className="text-sm text-red-600">{errors.website.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/owner/facilities/${facilityId}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Facility
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
