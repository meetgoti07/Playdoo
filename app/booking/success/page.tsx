"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  CreditCard,
  Download,
  Share2,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface BookingData {
  id: string;
  status: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalAmount: number;
  finalAmount: number;
  facility: {
    name: string;
    address: string;
    city: string;
    phone: string;
  };
  court: {
    name: string;
    sportType: string;
  };
  payment: {
    status: string;
    paidAt: string;
    transactionId: string;
  };
}

export default function BookingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check for different possible parameter names that Stripe might use
  const sessionId = searchParams.get("session_id") || 
                   searchParams.get("checkout_session_id") ||
                   searchParams.get("session");
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBookingDetails = async () => {
    if (!sessionId) {
      console.log("No session ID found in URL params");
      setError("No booking session found in URL");
      setLoading(false);
      return;
    }

    console.log("Fetching booking for session ID:", sessionId);

    try {
      // First, try to get booking by session ID
      const response = await fetch(`/api/bookings/session/${sessionId}`);
      const data = await response.json();

      console.log("API Response:", data);
      console.log("Response status:", response.status);

      if (response.ok && data.booking) {
        setBooking(data.booking);
        setError(null);
      } else {
        // If session endpoint fails, try alternative approaches
        console.log("Session endpoint failed, trying alternatives...");
        
        // Try verifying with Stripe directly (if you have this endpoint)
        const stripeResponse = await fetch(`/api/stripe/verify-session/${sessionId}`);
        if (stripeResponse.ok) {
          const stripeData = await stripeResponse.json();
          if (stripeData.booking) {
            setBooking(stripeData.booking);
            setError(null);
          } else {
            setError(data.error || "Booking not found");
          }
        } else {
          setError(data.error || "Failed to fetch booking details");
        }
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setError("Network error while fetching booking details");
    } finally {
      setLoading(false);
    }
  };

  const shareBooking = async () => {
    if (!booking) return;

    const shareData = {
      title: "Court Booking Confirmed",
      text: `I've booked ${booking.court.name} at ${booking.facility.name} for ${format(new Date(booking.bookingDate), "MMMM d, yyyy")} from ${booking.startTime} to ${booking.endTime}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copy to clipboard
      await navigator.clipboard.writeText(shareData.text);
      toast.success("Booking details copied to clipboard!");
    }
  };

  useEffect(() => {
    fetchBookingDetails();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-3" />
            <span>Confirming your booking...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error ? "Booking Error" : "Booking Not Found"}
          </h2>
          <p className="text-gray-600 mb-6">
            {error || "We couldn't find the booking details."}
          </p>
          <div className="space-y-2 text-sm text-gray-500 mb-6">
            <p>Session ID: {sessionId || "Not provided"}</p>
            <p>If this issue persists, please contact support with the above session ID.</p>
          </div>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push("/bookings")}>
              Go to Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">Your court has been successfully booked and payment is complete.</p>
        </div>

        {/* Booking Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Booking Details</span>
              <Badge variant="default" className="bg-green-600">
                {booking.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Facility Info */}
            <div>
              <h3 className="font-semibold text-lg mb-2 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                {booking.facility.name}
              </h3>
              <p className="text-gray-600">{booking.facility.address}, {booking.facility.city}</p>
              <p className="text-sm text-gray-500">Phone: {booking.facility.phone}</p>
            </div>

            {/* Court Info */}
            <div>
              <h4 className="font-medium mb-2">Court Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600">Court:</span>
                  <span className="ml-2 font-medium">{booking.court.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Sport:</span>
                  <Badge variant="secondary" className="ml-2">
                    {booking.court.sportType.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Booking Time */}
            <div>
              <h4 className="font-medium mb-2">Date & Time</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <div>
                    <p className="font-medium">{format(new Date(booking.bookingDate), "EEEE")}</p>
                    <p className="text-sm text-gray-600">{format(new Date(booking.bookingDate), "MMMM d, yyyy")}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <div>
                    <p className="font-medium">{booking.startTime} - {booking.endTime}</p>
                    <p className="text-sm text-gray-600">1 hour duration</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div>
              <h4 className="font-medium mb-2">Payment Information</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="ml-2 font-semibold text-green-600">₹{booking.finalAmount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Payment Status:</span>
                    <Badge variant="default" className="ml-2 bg-green-600">
                      {booking.payment.status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">Paid On:</span>
                    <span className="ml-2 text-sm">{format(new Date(booking.payment.paidAt), "MMM d, yyyy 'at' h:mm a")}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Important Information</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Please arrive 10 minutes before your booking time</li>
              <li>• Bring a valid ID for verification</li>
              <li>• Cancellations must be made at least 2 hours in advance</li>
              <li>• Contact the facility directly for any changes or queries</li>
              <li>• Equipment rental is available at the facility</li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button onClick={() => router.push("/bookings")} className="flex-1">
            Go to Bookings
          </Button>
          <Button onClick={shareBooking} variant="outline" className="flex-1">
            <Share2 className="h-4 w-4 mr-2" />
            Share Booking
          </Button>
          <Button variant="outline" className="flex-1">
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
        </div>

        {/* Contact Support */}
        <div className="text-center mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Need help? Contact our support team at{" "}
            <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
              support@example.com
            </a>
            {" "}or call{" "}
            <a href="tel:+911234567890" className="text-blue-600 hover:underline">
              +91 12345 67890
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}