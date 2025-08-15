"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { BookingDashboard } from '@/components/bookings/BookingDashboard';
import { BookingHistory } from '@/components/bookings/BookingHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  History, 
  User, 
  Clock, 
  CreditCard, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Loader2,
  MapPin
} from 'lucide-react';
import { format } from "date-fns";
import { toast } from "sonner";
import { formatAmount } from "@/lib/utils";

interface Booking {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  bookingDate: string;
  startTime: string;
  endTime: string;
  finalAmount: number;
  createdAt: string;
  facility: {
    id: string;
    name: string;
    address: string;
    city: string;
    phone: string;
    rating: number;
    totalReviews: number;
  };
  court: {
    id: string;
    name: string;
    sportType: string;
    surface: string;
    capacity: number;
  };
  payment?: {
    status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
    gatewayOrderId?: string;
    transactionId?: string;
    paidAt?: string;
  };
}

export default function BookingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingPayment, setRetryingPayment] = useState<string | null>(null);

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
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "FAILED":
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const fetchBookings = async (status?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "50",
      });
      
      if (status && status !== "all") {
        params.append("status", status);
      }

      const response = await fetch(`/api/bookings?${params}`);
      const data = await response.json();

      if (response.ok) {
        setBookings(data.bookings);
      } else {
        toast.error(data.error || "Failed to fetch bookings");
      }
    } catch (error) {
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (bookingId: string) => {
    // Navigate to booking details page
    router.push(`/bookings/${bookingId}`);
  };

  const handleModifyBooking = (bookingId: string) => {
    // Navigate to modify booking page
    router.push(`/bookings/${bookingId}/modify`);
  };

  const retryPayment = async (bookingId: string) => {
    setRetryingPayment(bookingId);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/retry-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          successUrl: `${window.location.origin}/booking/success`,
          cancelUrl: `${window.location.origin}/booking/cancel`,
        }),
      });

      const data = await response.json();

      if (response.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error(data.error || "Failed to retry payment");
      }
    } catch (error) {
      toast.error("Failed to retry payment");
    } finally {
      setRetryingPayment(null);
    }
  };

  const filterBookings = (status?: string) => {
    if (!status || status === 'all') return bookings;
    return bookings.filter(booking => booking.status === status);
  };

  const pendingPaymentBookings = bookings.filter(
    booking => booking.status === "PENDING" && booking.payment?.status === "PENDING"
  );

  const renderBookingCard = (booking: Booking) => {
    const isUpcoming = new Date(booking.bookingDate) > new Date();
    const canRetryPayment = booking.status === "PENDING" && booking.payment?.status === "PENDING";

    return (
      <Card key={booking.id} className="overflow-hidden">
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col space-y-4">
            {/* Booking Info Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex-1">
                <h3 className="font-semibold text-base sm:text-lg">{booking.facility.name}</h3>
                <div className="flex items-center text-xs sm:text-sm text-gray-600">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                  <span className="line-clamp-1">{booking.facility.address}, {booking.facility.city}</span>
                </div>
              </div>
              <div className="self-start sm:self-center">
                {getStatusBadge(booking.status)}
              </div>
            </div>

            {/* Booking Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-gray-600">Court:</span>
                <div className="font-medium">{booking.court.name}</div>
                <Badge variant="secondary" className="text-xs mt-1">
                  {booking.court.sportType.replace("_", " ")}
                </Badge>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-gray-500 flex-shrink-0" />
                <div>
                  <div className="font-medium">{format(new Date(booking.bookingDate), "MMM d, yyyy")}</div>
                  <div className="text-gray-600">{format(new Date(booking.bookingDate), "EEEE")}</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-gray-500 flex-shrink-0" />
                <div>
                  <div className="font-medium">{booking.startTime} - {booking.endTime}</div>
                  <div className="text-gray-600">1 hour</div>
                </div>
              </div>
            </div>

            {/* Payment and Amount Info */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t space-y-2 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center">
                  {booking.payment && getPaymentStatusIcon(booking.payment.status)}
                  <span className="ml-2 text-xs sm:text-sm text-gray-600">
                    Payment: {booking.payment?.status || "N/A"}
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  Booked: {format(new Date(booking.createdAt), "MMM d, h:mm a")}
                </div>
              </div>
              <div className="text-lg sm:text-xl font-semibold text-green-600">
                {formatAmount(booking.finalAmount)}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
              {canRetryPayment && (
                <Button
                  onClick={() => retryPayment(booking.id)}
                  disabled={retryingPayment === booking.id}
                  className="flex items-center justify-center w-full sm:w-auto"
                  size="sm"
                >
                  {retryingPayment === booking.id ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                  )}
                  Complete Payment
                </Button>
              )}
              
              <div className="flex gap-2">
                {booking.status === "CONFIRMED" && isUpcoming && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleModifyBooking(booking.id)}
                    className="flex-1 sm:flex-none"
                  >
                    Modify
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleViewDetails(booking.id)}
                  className="flex-1 sm:flex-none"
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    fetchBookings(value);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-6">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-3 sm:py-6">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          {/* Page Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Manage your court bookings, view history, and download receipts
            </p>
          </div>

          {/* Pending Payments Alert */}
          {pendingPaymentBookings.length > 0 && (
            <Card className="mb-4 sm:mb-6 border-yellow-200 bg-yellow-50">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start sm:items-center">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <div>
                    <h3 className="font-semibold text-yellow-800 text-sm sm:text-base">Pending Payments</h3>
                    <p className="text-xs sm:text-sm text-yellow-700">
                      You have {pendingPaymentBookings.length} booking{pendingPaymentBookings.length > 1 ? 's' : ''} 
                      with pending payments. Complete your payment to confirm your booking{pendingPaymentBookings.length > 1 ? 's' : ''}.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Dashboard with Better Filtering */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 sm:space-y-6">
            {/* Enhanced Tab Navigation */}
            <div className="overflow-x-auto">
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 min-w-max">
                <TabsTrigger value="all" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>All ({bookings.length})</span>
                </TabsTrigger>
                <TabsTrigger value="PENDING" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Pending</span>
                  <span className="sm:hidden">P</span>
                  <span>({filterBookings("PENDING").length})</span>
                </TabsTrigger>
                <TabsTrigger value="CONFIRMED" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Confirmed</span>
                  <span className="sm:hidden">C</span>
                  <span>({filterBookings("CONFIRMED").length})</span>
                </TabsTrigger>
                <TabsTrigger value="COMPLETED" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Completed</span>
                  <span className="sm:hidden">Done</span>
                  <span>({filterBookings("COMPLETED").length})</span>
                </TabsTrigger>
                <TabsTrigger value="CANCELLED" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm">
                  <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Cancelled</span>
                  <span className="sm:hidden">X</span>
                  <span>({filterBookings("CANCELLED").length})</span>
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm">
                  <History className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Advanced</span>
                  <span className="sm:hidden">Adv</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* All Bookings */}
            <TabsContent value="all" className="space-y-4">
              {bookings.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
                    <p className="text-gray-600 mb-4">You haven't made any court bookings yet.</p>
                    <Link href="/venues">
                      <Button>
                        Book a Court
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                bookings.map(renderBookingCard)
              )}
            </TabsContent>

            {/* Filtered Bookings by Status */}
            {["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((status) => (
              <TabsContent key={status} value={status} className="space-y-4">
                {filterBookings(status).length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No {status.toLowerCase()} bookings</h3>
                      <p className="text-gray-600">You don't have any {status.toLowerCase()} bookings at the moment.</p>
                    </CardContent>
                  </Card>
                ) : (
                  filterBookings(status).map(renderBookingCard)
                )}
              </TabsContent>
            ))}

            {/* Advanced Dashboard View */}
            <TabsContent value="dashboard">
              <BookingDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
