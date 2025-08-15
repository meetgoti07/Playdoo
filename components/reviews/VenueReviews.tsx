"use client"
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewCard } from './ReviewCard';
import { ReviewStatsDisplay } from './ReviewStatsDisplay';
import { WriteReviewForm } from './WriteReviewForm';
import { useVenueReviews, useUserReviewEligibility } from '@/hooks/swr/reviews';
import { PenSquare, MessageSquare } from 'lucide-react';

interface VenueReviewsProps {
  venueId: string;
}

export function VenueReviews({ venueId }: VenueReviewsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const reviewsPerPage = 10;

  const { reviews, stats, pagination, isLoading: reviewsLoading, error: reviewsError, mutate: mutateReviews } = useVenueReviews(venueId, currentPage, reviewsPerPage);
  const { canReview, eligibleBookings, existingReviews, isLoading: eligibilityLoading, mutate: mutateEligibility } = useUserReviewEligibility(venueId);

  const handleReviewSubmitted = () => {
    setShowWriteReview(false);
    mutateReviews(); // Refresh reviews
    mutateEligibility(); // Refresh eligibility
  };

  if (reviewsLoading) {
    return <VenueReviewsSkeleton />;
  }

  if (reviewsError) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Failed to load reviews</p>
            <Button 
              variant="outline" 
              onClick={() => mutateReviews()} 
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Stats */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Customer Reviews
            </CardTitle>
            {!eligibilityLoading && canReview && !showWriteReview && (
              <Button 
                onClick={() => setShowWriteReview(true)}
                className="flex items-center gap-2"
              >
                <PenSquare className="w-4 h-4" />
                Write Review
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {stats ? (
            <ReviewStatsDisplay stats={stats} />
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">No reviews yet</p>
              <p className="text-sm text-gray-400 mt-1">Be the first to review this venue!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Write Review Form */}
      {showWriteReview && (
        <WriteReviewForm
          venueId={venueId}
          eligibleBookings={eligibleBookings}
          onReviewSubmitted={handleReviewSubmitted}
          onCancel={() => setShowWriteReview(false)}
        />
      )}

      {/* Existing Reviews from User */}
      {existingReviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {existingReviews.map((review) => (
              <div key={review.id} className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Your Review</Badge>
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm font-medium">{review.rating}.0</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-gray-700 mb-2">{review.comment}</p>
                )}
                <div className="text-xs text-gray-500">
                  For {review.booking.court.name} • {new Date(review.booking.bookingDate).toLocaleDateString()}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {reviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              All Reviews ({stats?.total || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {pagination.total_pages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(pagination.total_pages, prev + 1))}
                  disabled={currentPage === pagination.total_pages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Reviews State */}
      {reviews.length === 0 && stats?.total === 0 && (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No reviews yet
              </h3>
              <p className="text-gray-600 mb-4">
                This venue hasn't received any reviews yet. Be the first to share your experience!
              </p>
              {!eligibilityLoading && canReview && (
                <Button onClick={() => setShowWriteReview(true)}>
                  Write the First Review
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function VenueReviewsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <Skeleton className="h-12 w-16 mx-auto mb-2" />
              <Skeleton className="h-4 w-24 mx-auto mb-1" />
              <Skeleton className="h-3 w-16 mx-auto" />
            </div>
            <div className="flex-1 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3" />
                  <Skeleton className="h-3 w-3" />
                  <Skeleton className="h-2 flex-1" />
                  <Skeleton className="h-3 w-6" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-8" />
              </div>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-4 w-64" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
