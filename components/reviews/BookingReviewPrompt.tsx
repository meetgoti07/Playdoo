"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StarRating } from './StarRating';
import { formatSportType } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2, Star } from 'lucide-react';

interface BookingReviewPromptProps {
  bookingId: string;
  facilityName: string;
  courtName: string;
  sportType: string;
  bookingDate: string;
  onReviewSubmitted?: () => void;
}

export function BookingReviewPrompt({
  bookingId,
  facilityName,
  courtName,
  sportType,
  bookingDate,
  onReviewSubmitted,
}: BookingReviewPromptProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please provide a rating');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit review');
      }

      toast.success('Review submitted successfully!');
      setShowReviewForm(false);
      onReviewSubmitted?.();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showReviewForm) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-900 mb-1">
                How was your experience?
              </h3>
              <p className="text-sm text-green-700">
                Share your feedback about {facilityName}
              </p>
            </div>
            <Button 
              onClick={() => setShowReviewForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Star className="w-4 h-4 mr-2" />
              Rate Experience
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-blue-900">Rate Your Experience</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmitReview} className="space-y-4">
          {/* Booking Details */}
          <div className="p-4 bg-white rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-2">{facilityName}</h4>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">
                {formatSportType(sportType)}
              </Badge>
              <span>{courtName}</span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-500">
                {format(new Date(bookingDate), 'MMM d, yyyy')}
              </span>
            </div>
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
              Share your experience (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell other players about your experience..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={rating === 0 || isSubmitting}
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
              onClick={() => setShowReviewForm(false)}
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
