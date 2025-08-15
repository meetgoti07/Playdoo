"use client";

import { useState } from 'react';
import { BookingStatus } from '@/lib/generated/prisma';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ReportButton } from '@/components/ui/ReportButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { formatAmount } from '@/lib/utils';
import { 
  MapPin, 
  Clock, 
  IndianRupee, 
  Phone, 
  Star,
  Calendar,
  Users,
  Download,
  X,
  Eye,
  AlertTriangle,
  MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { formatTime as utilFormatTime, formatDate as utilFormatDate } from '@/lib/utils';

interface BookingCardProps {
  booking: any; // Using any for now, will be properly typed
  onUpdate: () => void;
}

export function BookingCard({ booking, onUpdate }: BookingCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Simple toast function (can be replaced with proper toast library later)
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    alert(message); // Simple fallback, can be replaced with proper toast
  };

  // Check if booking can be cancelled (24 hours before start time)
  const canCancel = () => {
    if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.PENDING) {
      return false;
    }
    
    if (!booking.bookingDate || !booking.startTime) {
      return false;
    }
    
    try {
      let startTimeString = booking.startTime;
      
      // Handle different time formats
      if (startTimeString.includes('T')) {
        startTimeString = startTimeString.split('T')[1]?.split('.')[0] || startTimeString;
      }
      
      // Remove any timezone info if present
      startTimeString = startTimeString.split('+')[0].split('Z')[0];
      
      const bookingDateTime = new Date(`${booking.bookingDate}T${startTimeString}`);
      
      // Check if the date is valid
      if (isNaN(bookingDateTime.getTime())) {
        console.warn('Invalid booking date/time:', booking.bookingDate, booking.startTime);
        return false;
      }
      
      const now = new Date();
      const timeDifference = bookingDateTime.getTime() - now.getTime();
      const hoursUntilBooking = timeDifference / (1000 * 60 * 60);
      
      return hoursUntilBooking >= 24;
    } catch (error) {
      console.error('Error checking cancellation eligibility:', error);
      return false;
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    const variants = {
      [BookingStatus.PENDING]: { variant: 'secondary' as const, label: 'Pending' },
      [BookingStatus.CONFIRMED]: { variant: 'default' as const, label: 'Confirmed' },
      [BookingStatus.CANCELLED]: { variant: 'destructive' as const, label: 'Cancelled' },
      [BookingStatus.COMPLETED]: { variant: 'outline' as const, label: 'Completed' },
      [BookingStatus.NO_SHOW]: { variant: 'destructive' as const, label: 'No Show' },
    };

    const config = variants[status];
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const getSportIcon = (sportType: string) => {
    // Return a generic icon for now, can be customized per sport
    return <Users className="w-4 h-4" />;
  };

  const handleCancelBooking = async () => {
    if (!cancellationReason.trim()) {
      showToast("Please provide a reason for cancellation", 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
          cancellationReason: cancellationReason.trim(),
        }),
      });

      if (response.ok) {
        showToast("Booking cancelled successfully", 'success');
        setShowCancelDialog(false);
        setCancellationReason('');
        onUpdate(); // Refresh the bookings list
      } else {
        const errorData = await response.json();
        showToast(errorData.error || "Failed to cancel booking", 'error');
      }
    } catch (error) {
      showToast("Failed to cancel booking. Please try again.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReceipt = async () => {
    try {
      const response = await fetch(`/api/bookings/${booking.id}/receipt`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `booking-receipt-${booking.hashId}.html`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        showToast("Receipt downloaded successfully", 'success');
      } else {
        const errorData = await response.json();
        showToast(errorData.error || "Failed to download receipt", 'error');
      }
    } catch (error) {
      showToast("Failed to download receipt. Please try again.", 'error');
    }
  };

  const formatTime = utilFormatTime;
  const formatDate = utilFormatDate;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border border-gray-200">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {booking.facility?.name || 'Unknown Facility'}
              </h3>
              
              {/* Report Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8 ml-2 flex-shrink-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <ReportButton
                      targetType="VENUE"
                      targetId={booking.facility?.id || ''}
                      variant="ghost"
                      size="sm"
                      inDropdown={true}
                      className="w-full justify-start border-0 p-0 h-auto font-normal"
                    />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{booking.facility?.city || 'Unknown Location'}</span>
              {booking.facility?.rating && (
                <>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{booking.facility.rating.toFixed(1)}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="text-right space-y-2 flex-shrink-0 ml-4">
            {getStatusBadge(booking.status)}
            <p className="text-sm text-gray-500">
              #{booking.hashId}
            </p>
          </div>
        </div>

        {/* Booking Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              {getSportIcon(booking.court?.sportType || 'unknown')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-600">Court</p>
              <p className="font-medium truncate">{booking.court?.name || 'Unknown Court'}</p>
              <p className="text-xs text-gray-500 capitalize">
                {booking.court?.sportType ? booking.court.sportType.replace('_', ' ').toLowerCase() : 'Unknown sport'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
              <Calendar className="w-4 h-4 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-medium">{booking.bookingDate ? formatDate(booking.bookingDate) : 'Unknown Date'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-600">Time</p>
              <p className="font-medium">
                {booking.startTime && booking.endTime 
                  ? `${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}`
                  : 'Unknown Time'
                }
              </p>
              {booking.totalHours && (
                <p className="text-xs text-gray-500">
                  {booking.totalHours}h
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
              <IndianRupee className="w-4 h-4 text-yellow-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-600">Amount</p>
              <p className="font-medium">{formatAmount(booking.finalAmount || 0)}</p>
              {booking.payment?.status && (
                <p className="text-xs text-gray-500 capitalize">
                  {booking.payment.status.toLowerCase()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Special Requests */}
        {booking.specialRequests && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Special Requests:</p>
            <p className="text-sm">{booking.specialRequests}</p>
          </div>
        )}

        {/* Cancellation Info */}
        {booking.status === BookingStatus.CANCELLED && booking.cancellationReason && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Cancelled</p>
                <p className="text-sm text-red-700">{booking.cancellationReason}</p>
                {booking.cancelledAt && (
                  <p className="text-xs text-red-600 mt-1">
                    Cancelled on {format(new Date(booking.cancelledAt), 'MMM dd, yyyy at h:mm a')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetailsDialog(true)}
            className="flex items-center gap-2 hover:bg-gray-50"
          >
            <Eye className="w-4 h-4" />
            View Details
          </Button>


          {canCancel() && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelDialog(true)}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          )}
        </div>

        {/* Cancel Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Booking</DialogTitle>
              <DialogDescription>
                Are you sure you want to cancel this booking? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reason">Reason for cancellation</Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a reason for cancelling this booking..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCancelDialog(false)}
                disabled={isLoading}
              >
                Keep Booking
              </Button>
              <Button
                variant="destructive"
                onClick={handleCancelBooking}
                disabled={isLoading || !cancellationReason.trim()}
              >
                {isLoading ? 'Cancelling...' : 'Cancel Booking'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Details Dialog */}
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Booking Details</DialogTitle>
              <DialogDescription>
                Complete information about your booking
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Facility Information */}
              <div>
                <h4 className="font-semibold mb-3">Facility Information</h4>
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {booking.facility.name}</p>
                  <p><span className="font-medium">Address:</span> {booking.facility.address}, {booking.facility.city}</p>
                  <p><span className="font-medium">Phone:</span> {booking.facility.phone}</p>
                  {booking.facility.rating && (
                    <p><span className="font-medium">Rating:</span> {booking.facility.rating.toFixed(1)} ⭐</p>
                  )}
                </div>
              </div>

              {/* Booking Information */}
              <div>
                <h4 className="font-semibold mb-3">Booking Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p><span className="font-medium">Court:</span> {booking.court.name}</p>
                    <p><span className="font-medium">Sport:</span> {booking.court.sportType.replace('_', ' ')}</p>
                    <p><span className="font-medium">Date:</span> {formatDate(booking.bookingDate)}</p>
                    <p><span className="font-medium">Time:</span> {formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p>
                    <p><span className="font-medium">Duration:</span> {booking.totalHours} hours</p>
                  </div>
                  <div>
                    <p><span className="font-medium">Status:</span> {getStatusBadge(booking.status)}</p>
                    <p><span className="font-medium">Booking ID:</span> #{booking.hashId}</p>
                    <p><span className="font-medium">Booked on:</span> {format(new Date(booking.createdAt), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              {booking.payment && (
                <div>
                  <h4 className="font-semibold mb-3">Payment Information</h4>
                  <div className="space-y-2">
                    <p><span className="font-medium">Amount:</span> {formatAmount(booking.payment.amount)}</p>
                    <p><span className="font-medium">Platform Fee:</span> {formatAmount(booking.payment.platformFee)}</p>
                    <p><span className="font-medium">Tax:</span> {formatAmount(booking.payment.tax)}</p>
                    <p><span className="font-medium">Total Amount:</span> {formatAmount(booking.payment.totalAmount)}</p>
                    <p><span className="font-medium">Payment Method:</span> {booking.payment.paymentMethod.replace('_', ' ')}</p>
                    <p><span className="font-medium">Payment Status:</span> 
                      <Badge variant={booking.payment.status === 'COMPLETED' ? 'default' : 'secondary'} className="ml-2">
                        {booking.payment.status}
                      </Badge>
                    </p>
                    {booking.payment.transactionId && (
                      <p><span className="font-medium">Transaction ID:</span> {booking.payment.transactionId}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Review Information */}
              {booking.review && (
                <div>
                  <h4 className="font-semibold mb-3">Your Review</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Rating:</span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < booking.review.rating 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {booking.review.comment && (
                      <p><span className="font-medium">Comment:</span> {booking.review.comment}</p>
                    )}
                    <p><span className="font-medium">Reviewed on:</span> {format(new Date(booking.review.createdAt), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
