import { Progress } from '@/components/ui/progress';
import { StarRating } from './StarRating';
import { ReviewStats } from '@/hooks/swr/reviews';

interface ReviewStatsDisplayProps {
  stats: ReviewStats;
}

export function ReviewStatsDisplay({ stats }: ReviewStatsDisplayProps) {
  const { total, average, ratingDistribution } = stats;

  if (total === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">No reviews yet</p>
        <p className="text-sm text-gray-400 mt-1">Be the first to review this venue!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Rating */}
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900">
            {average.toFixed(1)}
          </div>
          <div className="flex items-center justify-center mt-1">
            <StarRating rating={average} size="md" />
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {total} review{total !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingDistribution[rating as keyof typeof ratingDistribution];
            const percentage = total > 0 ? (count / total) * 100 : 0;

            return (
              <div key={rating} className="flex items-center gap-2 text-sm">
                <span className="w-3 text-gray-600">{rating}</span>
                <StarRating rating={1} maxRating={1} size="sm" />
                <div className="flex-1">
                  <Progress value={percentage} className="h-2" />
                </div>
                <span className="w-8 text-gray-500 text-xs">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
