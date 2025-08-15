"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { format, addDays, isAfter, isBefore, startOfDay } from "date-fns";
import { toast } from "sonner";
import { formatAmount } from "@/lib/utils";

interface BookingDetails {
  id: string;
  status: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  finalAmount: number;
  facility: {
    id: string;
    name: string;
    address: string;
    city: string;
  };
  court: {
    id: string;
    name: string;
    sportType: string;
    hourlyRate: number;
  };
}

interface TimeSlot {
  time: string;
  available: boolean;
  price: number;
}

export default function ModifyBookingPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [modificationFee, setModificationFee] = useState(0);

  const bookingId = params.id as string;

  const fetchBookingDetails = async () => {
    try {
      globalThis?.logger?.info({
        meta: {
          requestId: crypto.randomUUID(),
          bookingId: bookingId,
        },
        message: 'Fetching booking details for modification.',
      });

      const response = await fetch(`/api/bookings/${bookingId}`);
      const data = await response.json();

      if (response.ok) {
        setBooking(data.booking);
        setSelectedDate(new Date(data.booking.bookingDate));
        setSelectedTime(data.booking.startTime);
      } else {
        toast.error(data.error || "Failed to fetch booking details");
        if (response.status === 404) {
          router.push('/bookings');
        }
      }
    } catch (error) {
      globalThis?.logger?.error({
        err: error,
        message: 'Failed to fetch booking details for modification.',
      });
      toast.error("Failed to fetch booking details");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (date: Date, courtId: string) => {
    if (!date || !courtId) return;

    setLoadingSlots(true);
    try {
      const response = await fetch(
        `/api/courts/${courtId}/availability?date=${format(date, 'yyyy-MM-dd')}`
      );
      const data = await response.json();

      if (response.ok) {
        setAvailableSlots(data.slots || []);
      } else {
        toast.error("Failed to fetch available slots");
        setAvailableSlots([]);
      }
    } catch (error) {
      toast.error("Failed to fetch available slots");
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const calculateModificationFee = async (newDate: string, newTime: string) => {
    if (!booking) return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}/modification-fee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newDate,
          newTime,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setModificationFee(data.fee || 0);
      }
    } catch (error) {
      console.error('Failed to calculate modification fee:', error);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime('');
    if (date && booking) {
      fetchAvailableSlots(date, booking.court.id);
      calculateModificationFee(format(date, 'yyyy-MM-dd'), '');
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    if (selectedDate && booking) {
      calculateModificationFee(format(selectedDate, 'yyyy-MM-dd'), time);
    }
  };

  const handleModifyBooking = async () => {
    if (!booking || !selectedDate || !selectedTime) {
      toast.error("Please select both date and time");
      return;
    }

    setSaving(true);
    try {
      globalThis?.logger?.info({
        meta: {
          requestId: crypto.randomUUID(),
          bookingId: bookingId,
          newDate: format(selectedDate, 'yyyy-MM-dd'),
          newTime: selectedTime,
        },
        message: 'Modifying booking.',
      });

      const response = await fetch(`/api/bookings/${bookingId}/modify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newDate: format(selectedDate, 'yyyy-MM-dd'),
          newTime: selectedTime,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Booking modified successfully");
        router.push(`/bookings/${bookingId}`);
      } else {
        toast.error(data.error || "Failed to modify booking");
      }
    } catch (error) {
      globalThis?.logger?.error({
        err: error,
        message: 'Failed to modify booking.',
      });
      toast.error("Failed to modify booking");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  useEffect(() => {
    if (booking && selectedDate) {
      fetchAvailableSlots(selectedDate, booking.court.id);
    }
  }, [booking]);

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-6">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!booking) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-6">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h1>
              <p className="text-gray-600 mb-6">The booking you're trying to modify doesn't exist or you don't have permission to modify it.</p>
              <Link href="/bookings">
                <Button>Back to Bookings</Button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (booking.status !== "CONFIRMED") {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-6">
          <div className="max-w-4xl mx-auto px-4">
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Cannot Modify Booking</h1>
              <p className="text-gray-600 mb-6">Only confirmed bookings can be modified. This booking has status: {booking.status}</p>
              <Link href={`/bookings/${bookingId}`}>
                <Button>View Booking Details</Button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const minDate = addDays(new Date(), 1); // Can only modify to future dates
  const maxDate = addDays(new Date(), 30); // Can modify up to 30 days ahead
  const isDateChanged = selectedDate && format(selectedDate, 'yyyy-MM-dd') !== booking.bookingDate;
  const isTimeChanged = selectedTime !== booking.startTime;
  const hasChanges = isDateChanged || isTimeChanged;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link href={`/bookings/${bookingId}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Booking Details
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Modify Booking</h1>
            <p className="text-gray-600">Change your booking date or time</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Current Booking Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Booking</CardTitle>
                  <CardDescription>Your current reservation details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold">{booking.facility.name}</h3>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      {booking.facility.address}, {booking.facility.city}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-600">Court</Label>
                      <p className="font-medium">{booking.court.name}</p>
                      <Badge variant="secondary" className="mt-1">
                        {booking.court.sportType.replace("_", " ")}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-gray-600">Current Date & Time</Label>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{format(new Date(booking.bookingDate), "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{booking.startTime} - {booking.endTime}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Date Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select New Date</CardTitle>
                  <CardDescription>Choose a new date for your booking (up to 30 days ahead)</CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => 
                      isBefore(date, minDate) || isAfter(date, maxDate) || 
                      format(date, 'yyyy-MM-dd') === booking.bookingDate
                    }
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              {/* Time Selection */}
              {selectedDate && (
                <Card>
                  <CardHeader>
                    <CardTitle>Select Time Slot</CardTitle>
                    <CardDescription>
                      Available time slots for {format(selectedDate, "EEEE, MMM d, yyyy")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="ml-2">Loading available slots...</span>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {availableSlots.map((slot) => (
                          <Button
                            key={slot.time}
                            variant={selectedTime === slot.time ? "default" : "outline"}
                            disabled={!slot.available}
                            onClick={() => handleTimeSelect(slot.time)}
                            className="flex flex-col h-auto py-3"
                          >
                            <span className="font-medium">{slot.time}</span>
                            <span className="text-xs">{formatAmount(slot.price)}</span>
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No available slots for this date
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Modification Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Modification Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasChanges ? (
                    <>
                      {isDateChanged && (
                        <div>
                          <Label className="text-gray-600">Date Change</Label>
                          <div className="text-sm">
                            <div className="line-through text-gray-500">
                              {format(new Date(booking.bookingDate), "MMM d, yyyy")}
                            </div>
                            <div className="text-green-600 font-medium">
                              {format(selectedDate!, "MMM d, yyyy")}
                            </div>
                          </div>
                        </div>
                      )}

                      {isTimeChanged && (
                        <div>
                          <Label className="text-gray-600">Time Change</Label>
                          <div className="text-sm">
                            <div className="line-through text-gray-500">
                              {booking.startTime} - {booking.endTime}
                            </div>
                            <div className="text-green-600 font-medium">
                              {selectedTime} - {selectedTime ? format(new Date(`2000-01-01 ${selectedTime}`).getTime() + 60*60*1000, 'HH:mm') : ''}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="border-t pt-4">
                        <div className="flex justify-between">
                          <span>Original Amount</span>
                          <span>{formatAmount(booking.finalAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Modification Fee</span>
                          <span>{formatAmount(modificationFee)}</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t pt-2">
                          <span>Total</span>
                          <span>{formatAmount(booking.finalAmount + modificationFee)}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-500 text-sm">No changes selected</p>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardContent className="pt-6">
                  <Button
                    onClick={handleModifyBooking}
                    disabled={!hasChanges || !selectedTime || saving}
                    className="w-full"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Modifying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm Modification
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {modificationFee > 0 
                      ? "Additional charges will be processed automatically" 
                      : "No additional charges for this modification"
                    }
                  </p>
                </CardContent>
              </Card>

              {/* Modification Policy */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Modification Policy</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-gray-600 space-y-2">
                  <p>• Bookings can be modified up to 24 hours before the scheduled time</p>
                  <p>• Modification fees may apply based on the new date and time</p>
                  <p>• Same-day modifications are not allowed</p>
                  <p>• Refunds for downgrades will be processed within 5-7 business days</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
