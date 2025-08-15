"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { 
  MapPin, 
  Clock, 
  Calendar, 
  Users, 
  CreditCard, 
  Tag, 
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  User,
  Phone,
  Mail
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface BookingDetails {
  facility: {
    id: string;
    name: string;
    address: string;
    city: string;
    rating: number;
    totalReviews: number;
  };
  court: {
    id: string;
    name: string;
    sportType: string;
    pricePerHour: number;
    surface: string;
    capacity: number;
  };
  timeSlot: {
    id: string;
    startTime: string;
    endTime: string;
    date: string;
    price: number;
  };
}

interface PricingBreakdown {
  baseAmount: number;
  platformFee: number;
  tax: number;
  discountAmount: number;
  finalAmount: number;
  totalHours: number;
}

interface CouponData {
  valid: boolean;
  coupon: {
    id: string;
    code: string;
    name: string;
    description: string;
    discountType: string;
    discountValue: number;
  };
  discount: {
    amount: number;
    percentage: number;
  };
  finalAmount: number;
  savings: number;
}

interface UserDetails {
  fullName: string;
  email: string;
  phone: string;
  emergencyContact: string;
  emergencyPhone: string;
}

export default function BookingConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const facilityId = searchParams.get("facilityId");
  const courtId = searchParams.get("courtId");
  const timeSlotId = searchParams.get("timeSlotId");
  const selectedDate = searchParams.get("date");

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);
  
  // Form states
  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState<CouponData | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [specialRequests, setSpecialRequests] = useState("");
  
  // User details form
  const [userDetails, setUserDetails] = useState<UserDetails>({
    fullName: "",
    email: "",
    phone: "",
    emergencyContact: "",
    emergencyPhone: ""
  });
  const [userDetailsValid, setUserDetailsValid] = useState(false);

  // Validate user details
  const validateUserDetails = () => {
    const { fullName, email, phone } = userDetails;
    const isValid = fullName.trim() !== "" && 
                   email.trim() !== "" && 
                   /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
                   phone.trim() !== "" &&
                   /^[0-9]{10}$/.test(phone.replace(/\s+/g, ''));
    setUserDetailsValid(isValid);
    return isValid;
  };

  // Update user details
  const updateUserDetails = (field: keyof UserDetails, value: string) => {
    setUserDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    validateUserDetails();
  }, [userDetails]);

  // Fetch booking details
  const fetchBookingDetails = async () => {
    if (!facilityId || !courtId || !timeSlotId) {
      toast.error("Missing booking parameters");
      router.push("/booking");
      return;
    }

    try {
      // Fetch facility details
      const facilityResponse = await fetch(`/api/facilities/${facilityId}`);
      const facilityData = await facilityResponse.json();

      // Fetch court details
      const courtResponse = await fetch(`/api/facilities/${facilityId}/courts`);
      const courtsData = await courtResponse.json();
      const court = courtsData.courts.find((c: any) => c.id === courtId);

      // Fetch time slot details (using selected date)
      const dateStr = selectedDate || new Date().toISOString().split('T')[0];
      const timeSlotResponse = await fetch(`/api/courts/${courtId}/time-slots?date=${dateStr}`);
      const timeSlotsData = await timeSlotResponse.json();
      const timeSlot = timeSlotsData.timeSlots.find((ts: any) => ts.id === timeSlotId);

      if (!court || !timeSlot) {
        toast.error("Booking details not found");
        router.push("/booking");
        return;
      }

      const details: BookingDetails = {
        facility: facilityData.facility,
        court,
        timeSlot: {
          ...timeSlot,
          date: dateStr,
        },
      };

      setBookingDetails(details);
      calculatePricing(details, null);
    } catch (error) {
      toast.error("Failed to fetch booking details");
      router.push("/booking");
    } finally {
      setLoading(false);
    }
  };

  // Calculate pricing breakdown
  const calculatePricing = (details: BookingDetails, discount: CouponData | null) => {
    const startTime = new Date(`2000-01-01T${details.timeSlot.startTime}`);
    const endTime = new Date(`2000-01-01T${details.timeSlot.endTime}`);
    const totalHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    
    const baseAmount = details.timeSlot.price * totalHours;
    const platformFee = baseAmount * 0.03; // 3% platform fee
    const tax = (baseAmount + platformFee) * 0.18; // 18% GST
    const discountAmount = discount?.discount.amount || 0;
    const finalAmount = baseAmount + platformFee + tax - discountAmount;

    setPricing({
      baseAmount,
      platformFee,
      tax,
      discountAmount,
      finalAmount,
      totalHours,
    });
  };

  // Apply coupon
  const applyCoupon = async () => {
    if (!couponCode.trim() || !pricing) return;

    setCouponLoading(true);
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim(),
          totalAmount: pricing.baseAmount,
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setCouponData(data);
        calculatePricing(bookingDetails!, data);
        toast.success(`Coupon applied! You saved ₹${data.savings}`);
      } else {
        toast.error(data.error || "Invalid coupon code");
        setCouponData(null);
      }
    } catch (error) {
      toast.error("Failed to validate coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove coupon
  const removeCoupon = () => {
    setCouponCode("");
    setCouponData(null);
    if (bookingDetails) {
      calculatePricing(bookingDetails, null);
    }
  };

  // Proceed to payment
  const proceedToPayment = async () => {
    if (!bookingDetails || !pricing) return;

    // Validate user details
    if (!validateUserDetails()) {
      toast.error("Please fill in all required details");
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facilityId: bookingDetails.facility.id,
          courtId: bookingDetails.court.id,
          timeSlotId: bookingDetails.timeSlot.id,
          bookingDate: bookingDetails.timeSlot.date,
          specialRequests: specialRequests.trim() || null,
          couponCode: couponData?.coupon.code || null,
          userDetails: userDetails,
          successUrl: `${window.location.origin}/booking/success`,
          cancelUrl: `${window.location.origin}/booking/cancel`,
        }),
      });

      const data = await response.json();

      if (response.ok && data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl;
      } else {
        toast.error(data.error || "Failed to create booking");
      }
    } catch (error) {
      toast.error("Failed to process booking");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchBookingDetails();
  }, [facilityId, courtId, timeSlotId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!bookingDetails || !pricing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Booking Details Not Found</h2>
            <p className="text-gray-600 mb-4">Unable to load booking information.</p>
            <Button onClick={() => router.push("/booking")}>
              Start New Booking
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Confirm Your Booking</h1>
          <p className="text-gray-600">Review your booking details and complete payment</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Facility & Court Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Facility Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{bookingDetails.facility.name}</h3>
                  <p className="text-gray-600">{bookingDetails.facility.address}, {bookingDetails.facility.city}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-sm">⭐ {bookingDetails.facility.rating}</span>
                    <span className="text-xs text-gray-500 ml-1">({bookingDetails.facility.totalReviews} reviews)</span>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-2">Court: {bookingDetails.court.name}</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Sport:</span>
                      <Badge variant="secondary" className="ml-2">
                        {bookingDetails.court.sportType.replace("_", " ")}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-gray-600">Surface:</span>
                      <span className="ml-2 font-medium">{bookingDetails.court.surface}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-600">Capacity:</span>
                      <div className="flex items-center ml-2">
                        <Users className="h-4 w-4 mr-1" />
                        <span className="font-medium">{bookingDetails.court.capacity}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Price:</span>
                      <span className="ml-2 font-medium text-green-600">₹{bookingDetails.court.pricePerHour}/hr</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Booking Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Booking Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <div>
                      <p className="font-medium">{format(new Date(bookingDetails.timeSlot.date), "EEEE")}</p>
                      <p className="text-sm text-gray-600">{format(new Date(bookingDetails.timeSlot.date), "MMMM d, yyyy")}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <div>
                      <p className="font-medium">{bookingDetails.timeSlot.startTime} - {bookingDetails.timeSlot.endTime}</p>
                      <p className="text-sm text-gray-600">{pricing.totalHours} hour{pricing.totalHours > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Your Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="Enter your full name"
                      value={userDetails.fullName}
                      onChange={(e) => updateUserDetails("fullName", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={userDetails.email}
                        onChange={(e) => updateUserDetails("email", e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="1234567890"
                        value={userDetails.phone}
                        onChange={(e) => updateUserDetails("phone", e.target.value.replace(/\D/g, ''))}
                        className="pl-10"
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                    <Input
                      id="emergencyContact"
                      placeholder="Emergency contact name"
                      value={userDetails.emergencyContact}
                      onChange={(e) => updateUserDetails("emergencyContact", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="emergencyPhone"
                        type="tel"
                        placeholder="Emergency contact phone"
                        value={userDetails.emergencyPhone}
                        onChange={(e) => updateUserDetails("emergencyPhone", e.target.value.replace(/\D/g, ''))}
                        className="pl-10"
                        maxLength={10}
                      />
                    </div>
                  </div>
                </div>
                {!userDetailsValid && (
                  <div className="text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Please fill in all required fields with valid information
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Special Requests */}
            <Card>
              <CardHeader>
                <CardTitle>Special Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Any special requests or notes for your booking..."
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="min-h-[100px]"
                />
              </CardContent>
            </Card>

            {/* Coupon Code */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tag className="h-5 w-5 mr-2" />
                  Promo Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                {couponData ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                          <span className="font-medium text-green-800">{couponData.coupon.code}</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">{couponData.coupon.description}</p>
                        <p className="text-sm text-green-600 font-medium">You saved ₹{couponData.savings}!</p>
                      </div>
                      <Button
                        onClick={removeCoupon}
                        variant="outline"
                        size="sm"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter promo code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                    />
                    <Button
                      onClick={applyCoupon}
                      disabled={!couponCode.trim() || couponLoading}
                      variant="outline"
                    >
                      {couponLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Court rental ({pricing.totalHours}h)</span>
                    <span>₹{pricing.baseAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Platform fee (3%)</span>
                    <span>₹{pricing.platformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>GST (18%)</span>
                    <span>₹{pricing.tax.toFixed(2)}</span>
                  </div>
                  {pricing.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount</span>
                      <span>-₹{pricing.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>₹{pricing.finalAmount.toFixed(2)}</span>
                </div>

                <Button
                  onClick={proceedToPayment}
                  disabled={processing || !userDetailsValid}
                  className="w-full"
                  size="lg"
                >
                  {processing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay ₹{pricing.finalAmount.toFixed(2)}
                    </>
                  )}
                </Button>

                {!userDetailsValid && (
                  <div className="text-xs text-orange-600 text-center">
                    Please complete all required details to proceed
                  </div>
                )}

                <div className="text-xs text-gray-500 text-center">
                  By proceeding, you agree to our terms and conditions.
                  Your payment is secured by Stripe.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
