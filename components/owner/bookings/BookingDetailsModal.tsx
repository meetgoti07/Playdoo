"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  Star,
  CreditCard,
  Receipt,
  MessageSquare,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

interface BookingDetailsModalProps {
  bookingId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate?: () => void;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function BookingDetailsModal({
  bookingId,
  isOpen,
  onClose,
  onStatusUpdate,
}: BookingDetailsModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const { data, error, mutate } = useSWR(
    bookingId ? `/api/owner/bookings/${bookingId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const booking = data?.booking;

  const updateBookingStatus = async (status: string) => {
    if (!bookingId) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/owner/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success(`Booking ${status.toLowerCase()} successfully`);
        mutate(); // Refresh the booking data
        onStatusUpdate?.(); // Refresh parent data
      } else {
        toast.error("Failed to update booking status");
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      case "NO_SHOW":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "REFUNDED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (error) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <p className="text-lg font-semibold">Error loading booking details</p>
            <p className="text-gray-500">Please try again later</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!booking && isOpen) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading booking details...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Booking Details</span>
            <Badge className={getStatusColor(booking?.status)}>
              {booking?.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {booking && (
          <div className="space-y-6">
            {/* Customer Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Customer Information</h3>
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={booking.user.userProfile?.avatar} />
                    <AvatarFallback>
                      {booking.user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{booking.user.name}</p>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Mail className="h-3 w-3" />
                      <span>{booking.user.email}</span>
                    </div>
                    {booking.user.phone && (
                      <div className="flex items-center space-x-1 text-sm text-gray-500">
                        <Phone className="h-3 w-3" />
                        <span>{booking.user.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {booking.user.userProfile?.emergencyContact && (
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">Emergency Contact</p>
                    <p className="text-sm text-yellow-700">
                      {booking.user.userProfile.emergencyContact}
                    </p>
                    {booking.user.userProfile.emergencyPhone && (
                      <p className="text-sm text-yellow-700">
                        {booking.user.userProfile.emergencyPhone}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Booking Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Booking Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{booking.facility.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{new Date(booking.bookingDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{booking.startTime} - {booking.endTime}</span>
                    <span className="text-sm text-gray-500">
                      ({booking.totalHours} hour{booking.totalHours !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 flex items-center justify-center bg-blue-100 rounded text-xs text-blue-800">
                      C
                    </div>
                    <span>{booking.court.name} - {booking.court.sportType}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Special Requests */}
            {booking.specialRequests && (
              <>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Special Requests</h3>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5" />
                      <p className="text-sm text-blue-800">{booking.specialRequests}</p>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Payment Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Payment Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Rate per hour:</span>
                    <span>₹{booking.pricePerHour.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{booking.totalHours} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{booking.totalAmount.toLocaleString()}</span>
                  </div>
                  {booking.platformFee > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Platform fee:</span>
                      <span>₹{booking.platformFee.toLocaleString()}</span>
                    </div>
                  )}
                  {booking.tax > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Tax:</span>
                      <span>₹{booking.tax.toLocaleString()}</span>
                    </div>
                  )}
                  {booking.coupons.length > 0 && (
                    <div className="space-y-1">
                      {booking.coupons.map((coupon: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm text-green-600">
                          <span>{coupon.coupon.name} ({coupon.coupon.code}):</span>
                          <span>-₹{coupon.discountAmount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>₹{booking.finalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Payment Status</h3>
                {booking.payment ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Status:</span>
                      <Badge className={getPaymentStatusColor(booking.payment.status)}>
                        {booking.payment.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Method:</span>
                      <span>{booking.payment.paymentMethod}</span>
                    </div>
                    {booking.payment.transactionId && (
                      <div className="flex justify-between text-sm">
                        <span>Transaction ID:</span>
                        <span className="font-mono">{booking.payment.transactionId}</span>
                      </div>
                    )}
                    {booking.payment.paidAt && (
                      <div className="flex justify-between text-sm">
                        <span>Paid at:</span>
                        <span>{new Date(booking.payment.paidAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No payment information available</p>
                )}
              </div>
            </div>

            {/* Review */}
            {booking.review && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Customer Review</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < booking.review.rating
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(booking.review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {booking.review.comment && (
                      <p className="text-gray-700">{booking.review.comment}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Cancellation Reason */}
            {booking.status === "CANCELLED" && booking.cancellationReason && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Cancellation Reason</h3>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-800">{booking.cancellationReason}</p>
                    {booking.cancelledAt && (
                      <p className="text-xs text-red-600 mt-1">
                        Cancelled on {new Date(booking.cancelledAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Timestamps */}
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <span className="font-medium">Created:</span>{" "}
                {new Date(booking.createdAt).toLocaleString()}
              </div>
              {booking.confirmedAt && (
                <div>
                  <span className="font-medium">Confirmed:</span>{" "}
                  {new Date(booking.confirmedAt).toLocaleString()}
                </div>
              )}
              {booking.completedAt && (
                <div>
                  <span className="font-medium">Completed:</span>{" "}
                  {new Date(booking.completedAt).toLocaleString()}
                </div>
              )}
              {booking.noShowAt && (
                <div>
                  <span className="font-medium">No Show:</span>{" "}
                  {new Date(booking.noShowAt).toLocaleString()}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <Separator />
            <div className="flex justify-between items-center">
              <div className="space-x-2">
                {booking.status === "PENDING" && (
                  <>
                    <Button
                      onClick={() => updateBookingStatus("CONFIRMED")}
                      disabled={isUpdating}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Confirm Booking
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => updateBookingStatus("CANCELLED")}
                      disabled={isUpdating}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel Booking
                    </Button>
                  </>
                )}
                
                {booking.status === "CONFIRMED" && (
                  <Button
                    onClick={() => updateBookingStatus("COMPLETED")}
                    disabled={isUpdating}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Mark Complete
                  </Button>
                )}
              </div>
              
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
