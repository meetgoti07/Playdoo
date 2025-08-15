"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  XCircle, 
  ArrowLeft, 
  RefreshCw, 
  HelpCircle,
  AlertCircle,
  Loader2,
  Clock,
  Home
} from "lucide-react";
import { toast } from "sonner";

interface BookingData {
  id: string;
  status: string;
  facility: {
    name: string;
  };
  court: {
    name: string;
    sportType: string;
  };
  finalAmount: number;
}

export default function BookingCancelPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [retrying, setRetrying] = useState(false);

  const fetchBookingDetails = async () => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/bookings/session/${sessionId}`);
      const data = await response.json();

      if (response.ok) {
        setBooking(data.booking);
      }
    } catch (error) {
      // Fail silently for cancelled bookings
    } finally {
      setLoading(false);
    }
  };

  const retryPayment = async () => {
    if (!booking) return;

    setRetrying(true);
    try {
      const response = await fetch(`/api/bookings/${booking.id}/retry-payment`, {
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
      setRetrying(false);
    }
  };

  useEffect(() => {
    fetchBookingDetails();
  }, [sessionId]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Cancel Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
          <p className="text-gray-600">Your booking payment was cancelled or interrupted.</p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading booking details...</span>
            </CardContent>
          </Card>
        ) : booking ? (
          <>
            {/* Booking Details */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Booking Details</span>
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    Payment {booking.status === "PENDING" ? "Pending" : "Cancelled"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold">{booking.facility.name}</h3>
                    <p className="text-sm text-gray-600">{booking.court.name} - {booking.court.sportType.replace("_", " ")}</p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold">₹{booking.finalAmount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Information */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div className="space-y-2">
                    <h3 className="font-medium">What happened?</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Your payment was cancelled before completion</li>
                      <li>• Your booking slot is temporarily reserved for 30 minutes</li>
                      <li>• You can retry payment or the slot will be released automatically</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Button 
                onClick={retryPayment} 
                disabled={retrying}
                className="w-full"
                size="lg"
              >
                {retrying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry Payment
                  </>
                )}
              </Button>
              
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => router.push("/booking")} 
                  variant="outline"
                  className="w-full"
                >
                  <Home className="h-4 w-4 mr-2" />
                  New Booking
                </Button>
                
                <Button 
                  onClick={() => router.push("/bookings")} 
                  variant="outline"
                  className="w-full"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  My Bookings
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* No booking found - original cancelled state */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>What happened?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Your booking was cancelled before payment could be processed. This could happen for several reasons:
                </p>
                <ul className="space-y-2 text-sm text-gray-600 mb-4">
                  <li>• You clicked the back button during payment</li>
                  <li>• The payment session expired (30 minutes)</li>
                  <li>• You cancelled the payment process</li>
                  <li>• There was a technical issue</li>
                </ul>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm font-medium">
                    ✓ No payment has been charged to your account
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>What can you do now?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <RefreshCw className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Try booking again</h4>
                      <p className="text-sm text-gray-600">The time slot might still be available for booking.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <ArrowLeft className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Browse other options</h4>
                      <p className="text-sm text-gray-600">Look for alternative courts or time slots that suit your schedule.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Contact support</h4>
                      <p className="text-sm text-gray-600">If you experienced a technical issue, our support team can help.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => router.push("/booking")} 
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Booking Again
              </Button>
              
              <Button 
                onClick={() => router.push("/bookings")} 
                variant="outline" 
                className="flex-1"
              >
                Go to Dashboard
              </Button>
            </div>
          </>
        )}

        {/* Support Contact */}
        <div className="text-center mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Need assistance?</h4>
          <p className="text-sm text-gray-600">
            If you're having trouble with booking or payments, contact our support team:
          </p>
          <div className="mt-2 space-x-4">
            <a 
              href="mailto:support@example.com" 
              className="text-blue-600 hover:underline text-sm"
            >
              support@example.com
            </a>
            <span className="text-gray-300">|</span>
            <a 
              href="tel:+911234567890" 
              className="text-blue-600 hover:underline text-sm"
            >
              +91 12345 67890
            </a>
          </div>
        </div>

        {/* Tips for next time */}
        {!booking && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 Tips for successful booking:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Complete payment within 30 minutes to avoid session expiry</li>
              <li>• Ensure stable internet connection during payment</li>
              <li>• Have your payment details ready before starting</li>
              <li>• Check court availability in real-time</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
