"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVenueDetails } from '@/hooks/swr/venues';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Clock, 
  IndianRupee, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  CreditCard,
  Users,
  Timer,
  Tag
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatSportType } from '@/lib/utils';
import Link from 'next/link';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface VenueBookingProps {
  venueId: string;
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  price: number;
  isBooked: boolean;
  isBlocked: boolean;
  blockReason?: string;
  available: boolean;
}

interface Court {
  id: string;
  name: string;
  pricePerHour: number;
  facility: {
    id: string;
    name: string;
  };
}

interface TimeSlotResponse {
  court: Court;
  timeSlots: TimeSlot[];
  operatingHours: {
    openTime: string;
    closeTime: string;
    isClosed: boolean;
  };
  isUnderMaintenance: boolean;
}

interface UserDetails {
  fullName: string;
  email: string;
  phone: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

interface BookingStep {
  step: number;
  title: string;
  completed: boolean;
}

export function VenueBooking({ venueId }: VenueBookingProps) {
  const router = useRouter();
  const { venue, isLoading: venueLoading, error: venueError } = useVenueDetails(venueId);
  
  // Booking flow state
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails>({
    fullName: '',
    email: '',
    phone: '',
    emergencyContact: '',
    emergencyPhone: '',
  });
  const [specialRequests, setSpecialRequests] = useState('');
  const [couponCode, setCouponCode] = useState('');
  
  // Coupon state
  const [couponData, setCouponData] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  
  // API state
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [courtDetails, setCourtDetails] = useState<Court | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const steps: BookingStep[] = [
    { step: 1, title: 'Select Court', completed: !!selectedCourt },
    { step: 2, title: 'Choose Date & Time', completed: !!selectedDate && !!selectedTimeSlot },
    { step: 3, title: 'Your Details', completed: !!(userDetails.fullName && userDetails.email && userDetails.phone) },
    { step: 4, title: 'Review & Pay', completed: false },
  ];

  // Fetch time slots when court and date are selected
  useEffect(() => {
    if (selectedCourt && selectedDate) {
      fetchTimeSlots();
    }
  }, [selectedCourt, selectedDate]);

  const fetchTimeSlots = async () => {
    if (!selectedCourt || !selectedDate) return;

    setLoadingSlots(true);
    setSlotsError(null);
    
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(`/api/courts/${selectedCourt}/time-slots?date=${dateStr}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch time slots');
      }
      
      const data: TimeSlotResponse = await response.json();
      setTimeSlots(data.timeSlots);
      setCourtDetails(data.court);
      
      // Reset selected time slot if date changes
      setSelectedTimeSlot(null);
    } catch (error) {
      setSlotsError(error instanceof Error ? error.message : 'Failed to fetch time slots');
      setTimeSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedCourt || !selectedTimeSlot || !userDetails.fullName || !userDetails.email || !userDetails.phone) {
      setBookingError('Please fill in all required fields');
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          facilityId: venue?.id,
          courtId: selectedCourt,
          timeSlotId: selectedTimeSlot,
          specialRequests,
          couponCode: couponData?.coupon?.code || undefined,
          userDetails,
          success_url: `${window.location.origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/booking/cancel`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create booking');
      }

      const { checkoutUrl } = await response.json();
      
      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const getSelectedSlotDetails = () => {
    return timeSlots.find(slot => slot.id === selectedTimeSlot);
  };

  const calculatePrice = () => {
    const slot = getSelectedSlotDetails();
    if (!slot) return { totalAmount: 0, platformFee: 0, tax: 0, discountAmount: 0, finalAmount: 0 };

    const totalAmount = slot.price;
    const platformFee = totalAmount * 0.03; // 3% platform fee
    const tax = (totalAmount + platformFee) * 0.18; // 18% GST
    const discountAmount = couponData?.discount?.amount || 0;
    const finalAmount = Math.max(0, totalAmount + platformFee + tax - discountAmount);

    return { totalAmount, platformFee, tax, discountAmount, finalAmount };
  };

  // Apply coupon function
  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setBookingError('Please enter a coupon code');
      return;
    }

    const slot = getSelectedSlotDetails();
    if (!slot) {
      setBookingError('Please select a time slot first');
      return;
    }

    setCouponLoading(true);
    setBookingError(null);

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: couponCode.trim(),
          totalAmount: slot.price,
        }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setCouponData(data);
        setBookingError(null);
        toast.success(`Coupon applied! You saved ₹${data.savings}`);
      } else {
        setBookingError(data.error || 'Invalid coupon code');
        setCouponData(null);
        toast.error(data.error || 'Invalid coupon code');
      }
    } catch (error) {
      setBookingError('Failed to validate coupon');
      setCouponData(null);
      toast.error('Failed to validate coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove coupon function
  const removeCoupon = () => {
    setCouponCode('');
    setCouponData(null);
    setBookingError(null);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  if (venueLoading) {
    return <VenueBookingSkeleton />;
  }

  if (venueError || !venue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Venue not found</h2>
          <p className="text-gray-600 mb-4">The venue you're looking for doesn't exist or has been removed.</p>
          <Link href="/search">
            <Button>Back to Search</Button>
          </Link>
        </div>
      </div>
    );
  }

  const activeCourts = venue.courts.filter(court => court.isActive);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/venues/${venueId}`}>
            <Button variant="outline" className="flex items-center gap-2 mb-4">
              <ChevronLeft className="w-4 h-4" />
              Back to Venue
            </Button>
          </Link>
          
          <div className="flex items-center gap-4 mb-6">
            <MapPin className="w-6 h-6 text-gray-400" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{venue.name}</h1>
              <p className="text-gray-600">{venue.address}, {venue.city}, {venue.state}</p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <div key={step.step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step.completed 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : currentStep === step.step
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-white border-gray-300 text-gray-500'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.step}</span>
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  step.completed || currentStep === step.step ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Step 1: Select Court */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Select a Court
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {activeCourts.map((court) => (
                      <div
                        key={court.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedCourt === court.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedCourt(court.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{court.name}</h3>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="outline">{formatSportType(court.sportType)}</Badge>
                              {court.capacity && (
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Users className="w-4 h-4" />
                                  <span>Max {court.capacity} players</span>
                                </div>
                              )}
                            </div>
                            {court.description && (
                              <p className="text-gray-600 mt-2">{court.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                              ₹{court.pricePerHour}
                            </div>
                            <div className="text-sm text-gray-500">per hour</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedCourt && (
                    <div className="mt-6 flex justify-end">
                      <Button onClick={() => setCurrentStep(2)}>
                        Continue to Date & Time
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 2: Select Date & Time */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Choose Date & Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Date Selection */}
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Select Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div>
                      <Label className="text-base font-semibold mb-3 block">Select Time Slot</Label>
                      
                      {loadingSlots ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {Array.from({ length: 8 }).map((_, i) => (
                            <Skeleton key={i} className="h-16 w-full" />
                          ))}
                        </div>
                      ) : slotsError ? (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{slotsError}</AlertDescription>
                        </Alert>
                      ) : timeSlots.length === 0 ? (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>No time slots available for this date</AlertDescription>
                        </Alert>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {timeSlots.map((slot) => (
                            <Button
                              key={slot.id}
                              variant={selectedTimeSlot === slot.id ? "default" : "outline"}
                              disabled={!slot.available}
                              className={`h-16 flex flex-col items-center justify-center p-2 ${
                                !slot.available ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              onClick={() => slot.available && setSelectedTimeSlot(slot.id)}
                            >
                              <div className="text-sm font-semibold">
                                {formatTime(slot.startTime)}
                              </div>
                              <div className="text-xs opacity-75">
                                ₹{slot.price}
                              </div>
                              {!slot.available && (
                                <div className="text-xs text-red-500">
                                  {slot.isBooked ? 'Booked' : 'Blocked'}
                                </div>
                              )}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {selectedTimeSlot && (
                    <div className="mt-6 flex justify-between">
                      <Button variant="outline" onClick={() => setCurrentStep(1)}>
                        Back
                      </Button>
                      <Button onClick={() => setCurrentStep(3)}>
                        Continue to Details
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: User Details */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Your Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        value={userDetails.fullName}
                        onChange={(e) => setUserDetails(prev => ({ ...prev, fullName: e.target.value }))}
                        placeholder="Enter your full name"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userDetails.email}
                        onChange={(e) => setUserDetails(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter your email"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={userDetails.phone}
                        onChange={(e) => setUserDetails(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter your phone number"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="emergencyContact">Emergency Contact</Label>
                      <Input
                        id="emergencyContact"
                        value={userDetails.emergencyContact}
                        onChange={(e) => setUserDetails(prev => ({ ...prev, emergencyContact: e.target.value }))}
                        placeholder="Emergency contact name"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                      <Input
                        id="emergencyPhone"
                        value={userDetails.emergencyPhone}
                        onChange={(e) => setUserDetails(prev => ({ ...prev, emergencyPhone: e.target.value }))}
                        placeholder="Emergency contact phone"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
                    <Textarea
                      id="specialRequests"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="Any special requests or requirements..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setCurrentStep(2)}>
                      Back
                    </Button>
                    <Button 
                      onClick={() => setCurrentStep(4)}
                      disabled={!userDetails.fullName || !userDetails.email || !userDetails.phone}
                    >
                      Review Booking
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 4: Review & Payment */}
            {currentStep === 4 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Review & Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Booking Summary */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-lg mb-3">Booking Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Venue:</span>
                        <span className="font-medium">{venue.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Court:</span>
                        <span className="font-medium">{courtDetails?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span className="font-medium">{selectedDate ? format(selectedDate, "PPP") : ''}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <span className="font-medium">
                          {getSelectedSlotDetails() && `${formatTime(getSelectedSlotDetails()!.startTime)} - ${formatTime(getSelectedSlotDetails()!.endTime)}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Customer:</span>
                        <span className="font-medium">{userDetails.fullName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Coupon Code */}
                  <div>
                    <Label htmlFor="couponCode">Coupon Code (Optional)</Label>
                    {couponData ? (
                      <div className="mt-1 bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
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
                      <div className="flex gap-2 mt-1">
                        <Input
                          id="couponCode"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="Enter coupon code"
                          onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={applyCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                        >
                          {couponLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Apply'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>

                  {bookingError && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{bookingError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={() => setCurrentStep(3)}>
                      Back
                    </Button>
                    <Button 
                      onClick={handleBooking}
                      disabled={bookingLoading}
                      className="min-w-[120px]"
                    >
                      {bookingLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Pay & Book
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Price Summary */}
          <div className="space-y-6">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="w-5 h-5" />
                  Price Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTimeSlot ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Base Price (1 hour):</span>
                      <span>₹{calculatePrice().totalAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Fee (3%):</span>
                      <span>₹{calculatePrice().platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (18%):</span>
                      <span>₹{calculatePrice().tax.toFixed(2)}</span>
                    </div>
                    {calculatePrice().discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({couponData?.coupon?.code}):</span>
                        <span>-₹{calculatePrice().discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total Amount:</span>
                      <span className="text-green-600">₹{calculatePrice().finalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Timer className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Select a time slot to see pricing</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Booking Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Instant confirmation</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Free cancellation up to 2 hours before</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Secure payment with Stripe</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  <span>Equipment available for rent</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function VenueBookingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-10 w-32 mb-6" />
        <Skeleton className="h-12 w-96 mb-8" />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-48 mb-6" />
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
