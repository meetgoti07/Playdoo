"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  CreditCard, 
  Phone,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Star,
  Loader2
} from 'lucide-react';
import { format } from "date-fns";
import { toast } from "sonner";
import { formatAmount } from "@/lib/utils";

interface BookingDetails {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  bookingDate: string;
  startTime: string;
  endTime: string;
  finalAmount: number;
  createdAt: string;
  updatedAt: string;
  facility: {
    id: string;
    name: string;
    description: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    rating: number;
    totalReviews: number;
    images: string[];
  };
  court: {
    id: string;
    name: string;
    sportType: string;
    surface: string;
    capacity: number;
    description: string;
    hourlyRate: number;
  };
  payment?: {
    id: string;
    status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
    gatewayOrderId?: string;
    transactionId?: string;
    paidAt?: string;
    amount: number;
  };
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);

  const bookingId = params.id as string;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending Payment</Badge>;
      case "CONFIRMED":
        return <Badge variant="default" className="bg-green-600">Confirmed</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "COMPLETED":
        return <Badge variant="default" className="bg-blue-600">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusIcon = (status?: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "PENDING":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "FAILED":
      case "CANCELLED":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const fetchBookingDetails = async () => {
    try {
      globalThis?.logger?.info({
        meta: {
          requestId: crypto.randomUUID(),
          bookingId: bookingId,
        },
        message: 'Fetching booking details.',
      });

      const response = await fetch(`/api/bookings/${bookingId}`);
      const data = await response.json();

      if (response.ok) {
        setBooking(data.booking);
      } else {
        toast.error(data.error || "Failed to fetch booking details");
        if (response.status === 404) {
          router.push('/bookings');
        }
      }
    } catch (error) {
      globalThis?.logger?.error({
        err: error,
        message: 'Failed to fetch booking details.',
      });
      toast.error("Failed to fetch booking details");
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = async () => {
    if (!booking || booking.payment?.status !== "COMPLETED") {
      toast.error("Receipt not available");
      return;
    }

    setDownloadingReceipt(true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/receipt`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `booking-receipt-${bookingId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Receipt downloaded successfully");
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to download receipt");
      }
    } catch (error) {
      toast.error("Failed to download receipt");
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const cancelBooking = async () => {
    if (!booking || booking.status !== "CONFIRMED") return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok) {
        setBooking(prev => prev ? { ...prev, status: "CANCELLED" } : null);
        toast.success("Booking cancelled successfully");
      } else {
        toast.error(data.error || "Failed to cancel booking");
      }
    } catch (error) {
      toast.error("Failed to cancel booking");
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

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
              <p className="text-gray-600 mb-6">The booking you're looking for doesn't exist or you don't have permission to view it.</p>
              <Link href="/bookings">
                <Button>Back to Bookings</Button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const isUpcoming = new Date(booking.bookingDate) > new Date();
  const canCancel = booking.status === "CONFIRMED" && isUpcoming;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-6">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link href="/bookings" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
                <p className="text-gray-600">Booking ID: {booking.id}</p>
              </div>
              {getStatusBadge(booking.status)}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Facility Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Facility Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold">{booking.facility.name}</h3>
                    <div className="flex items-center mt-1">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm font-medium">{booking.facility.rating}</span>
                      <span className="text-sm text-gray-500 ml-1">({booking.facility.totalReviews} reviews)</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-gray-600">{booking.facility.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Address</h4>
                      <p className="text-gray-600">
                        {booking.facility.address}<br />
                        {booking.facility.city}, {booking.facility.state} {booking.facility.pincode}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Contact</h4>
                      <div className="flex items-center text-gray-600">
                        <Phone className="h-4 w-4 mr-2" />
                        {booking.facility.phone}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Booking Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Court</h4>
                      <p className="text-gray-600">{booking.court.name}</p>
                      <Badge variant="secondary" className="mt-1">
                        {booking.court.sportType.replace("_", " ")}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Surface & Capacity</h4>
                      <p className="text-gray-600">{booking.court.surface}</p>
                      <p className="text-gray-600">Up to {booking.court.capacity} players</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Date</h4>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {format(new Date(booking.bookingDate), "EEEE, MMM d, yyyy")}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Time</h4>
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        {booking.startTime} - {booking.endTime}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Duration</h4>
                      <p className="text-gray-600">1 hour</p>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium text-gray-900">Court Description</h4>
                    <p className="text-gray-600">{booking.court.description}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Payment Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {booking.payment && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Status</span>
                        <div className="flex items-center">
                          {getPaymentStatusIcon(booking.payment.status)}
                          <span className="ml-2 font-medium">{booking.payment.status}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Amount</span>
                        <span className="font-medium">{formatAmount(booking.payment.amount)}</span>
                      </div>

                      {booking.payment.transactionId && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Transaction ID</span>
                          <span className="font-mono text-sm">{booking.payment.transactionId}</span>
                        </div>
                      )}

                      {booking.payment.paidAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Paid At</span>
                          <span className="text-sm">{format(new Date(booking.payment.paidAt), "MMM d, h:mm a")}</span>
                        </div>
                      )}
                    </>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between font-semibold">
                    <span>Total Amount</span>
                    <span className="text-lg text-green-600">{formatAmount(booking.finalAmount)}</span>
                  </div>

                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {booking.status === "CONFIRMED" && isUpcoming && (
                    <Link href={`/bookings/${booking.id}/modify`}>
                      <Button variant="outline" className="w-full">
                        Modify Booking
                      </Button>
                    </Link>
                  )}

                  {canCancel && (
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={cancelBooking}
                    >
                      Cancel Booking
                    </Button>
                  )}

                  <Link href={`/venues/${booking.facility.id}`}>
                    <Button variant="ghost" className="w-full">
                      View Facility
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Booking Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Booking Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <div className="flex items-center text-gray-600">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      Booking Created
                    </div>
                    <div className="ml-5 text-gray-500">
                      {format(new Date(booking.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>

                  {booking.payment?.paidAt && (
                    <div className="text-sm">
                      <div className="flex items-center text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        Payment Completed
                      </div>
                      <div className="ml-5 text-gray-500">
                        {format(new Date(booking.payment.paidAt), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    </div>
                  )}

                  <div className="text-sm">
                    <div className="flex items-center text-gray-600">
                      <div className="w-2 h-2 bg-gray-300 rounded-full mr-3"></div>
                      Last Updated
                    </div>
                    <div className="ml-5 text-gray-500">
                      {format(new Date(booking.updatedAt), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
