"use client";

import { useDashboardBanners } from '@/hooks/swr/dashboard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export function WelcomeBanner() {
  const { banners, isLoading, error } = useDashboardBanners();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance carousel
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  if (isLoading) {
    return (
      <Card className="relative h-64 md:h-80 overflow-hidden">
        <Skeleton className="w-full h-full" />
      </Card>
    );
  }

  if (error || banners.length === 0) {
    return (
      <Card className="relative h-64 md:h-80 overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-6">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Welcome to QuickCourt
            </h1>
            <p className="text-lg md:text-xl mb-6">
              Book your favorite sports venues instantly!
            </p>
            <Link href="/search">
              <Button size="lg" variant="secondary">
                Explore Venues
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  const currentBanner = banners[currentIndex];

  return (
    <Card className="relative h-64 md:h-80 overflow-hidden group">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
        style={{ 
          backgroundImage: `url(${currentBanner.imageUrl})`,
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center text-white">
        <div className="text-center px-6 max-w-2xl">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4">
            {currentBanner.title}
          </h1>
          {currentBanner.description && (
            <p className="text-lg md:text-xl mb-6 text-gray-100">
              {currentBanner.description}
            </p>
          )}
          {currentBanner.linkUrl && (
            <Link href={currentBanner.linkUrl}>
              <Button size="lg" variant="secondary" className="bg-white text-gray-900 hover:bg-gray-100">
                Explore Now
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Navigation */}
      {banners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white border border-white/20 backdrop-blur-sm transition-all duration-200 h-10 w-10 z-20"
            onClick={prevSlide}
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white border border-white/20 backdrop-blur-sm transition-all duration-200 h-10 w-10 z-20"
            onClick={nextSlide}
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Dots indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3 z-20">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-200 border border-white/30 ${
                  index === currentIndex 
                    ? 'bg-white shadow-lg scale-110' 
                    : 'bg-white/40 hover:bg-white/60'
                }`}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
