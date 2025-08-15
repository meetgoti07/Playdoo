"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Star } from 'lucide-react';

interface ReviewDialogProps {
  booking: any;
  onReviewSubmitted: () => void;
}

export function ReviewDialog({ booking, onReviewSubmitted }: ReviewDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/bookings/${booking.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          comment: comment.trim(),
        }),
      });

      if (response.ok) {
        alert("Review submitted successfully!");
        setIsOpen(false);
        setRating(5);
        setComment('');
        onReviewSubmitted();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to submit review");
      }
    } catch (error) {
      alert("Failed to submit review. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center gap-2">
          <Star className="w-4 h-4" />
          Write Review
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Review Your Experience</DialogTitle>
          <DialogDescription>
            Share your feedback about {booking.facility.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-6 h-6 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              id="comment"
              placeholder="Share your experience about the facility, court condition, staff, etc."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          {/* Booking Details */}
          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <p><strong>Facility:</strong> {booking.facility.name}</p>
            <p><strong>Court:</strong> {booking.court.name}</p>
            <p><strong>Date:</strong> {new Date(booking.bookingDate).toLocaleDateString()}</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitReview}
            disabled={isLoading || rating === 0}
          >
            {isLoading ? 'Submitting...' : 'Submit Review'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
