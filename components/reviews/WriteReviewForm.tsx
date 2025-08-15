"use client"
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { StarRating } from './StarRating';
import { EligibleBooking, submitVenueReview } from '@/hooks/swr/reviews';
import { formatSportType } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface WriteReviewFormProps {
  venueId: string;
  eligibleBookings: EligibleBooking[];
  onReviewSubmitted: () => void;
  onCancel: () => void;
}

export function WriteReviewForm({
  venueId,
  eligibleBookings,
  onReviewSubmitted,
  onCancel,
}: WriteReviewFormProps) {
  const [selectedBooking, setSelectedBooking] = useState<string>('');
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBooking) {
      toast.error('Please select a booking to review');
      return;
    }

    if (rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitVenueReview(venueId, selectedBooking, rating, comment.trim() || undefined);
      toast.success('Review submitted successfully!');
      onReviewSubmitted();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBookingDetails = eligibleBookings.find(b => b.id === selectedBooking);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Select Booking */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select the booking you want to review
            </label>
            <Select value={selectedBooking} onValueChange={setSelectedBooking}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a completed booking" />
              </SelectTrigger>
              <SelectContent>
                {eligibleBookings.map((booking) => (
                  <SelectItem key={booking.id} value={booking.id}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {formatSportType(booking.court.sportType)}
                      </Badge>
                      <span>{booking.court.name}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-500">
                        {format(new Date(booking.bookingDate), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Rating
            </label>
            <div className="flex items-center gap-4">
              <StarRating
                rating={rating}
                readonly={false}
                onChange={setRating}
                size="lg"
              />
              {rating > 0 && (
                <span className="text-lg font-semibold text-gray-700">
                  {rating}.0
                </span>
              )}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review (Optional)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with other players..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Selected Booking Preview */}
          {selectedBookingDetails && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Reviewing:</h4>
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary">
                  {formatSportType(selectedBookingDetails.court.sportType)}
                </Badge>
                <span>{selectedBookingDetails.court.name}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-500">
                  {format(new Date(selectedBookingDetails.bookingDate), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="submit"
              disabled={!selectedBooking || rating === 0 || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
