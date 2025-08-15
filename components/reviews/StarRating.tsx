import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  readonly = true,
  onChange,
  className,
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleStarClick = (starRating: number) => {
    if (!readonly && onChange) {
      onChange(starRating);
    }
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: maxRating }, (_, index) => {
        const starRating = index + 1;
        const isFilled = starRating <= rating;
        const isHalfFilled = starRating - 0.5 <= rating && starRating > rating;

        return (
          <button
            key={index}
            type="button"
            disabled={readonly}
            onClick={() => handleStarClick(starRating)}
            className={cn(
              sizeClasses[size],
              'transition-colors',
              !readonly && 'hover:scale-110 cursor-pointer',
              readonly && 'cursor-default'
            )}
          >
            <Star
              className={cn(
                'transition-colors',
                isFilled || isHalfFilled
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-none text-gray-300',
                !readonly && 'hover:text-yellow-400'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
