"use client";

import { Layout } from '@/components/layout/Layout';
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner';
import { PopularVenues } from '@/components/dashboard/PopularVenues';
import { PopularSports } from '@/components/dashboard/PopularSports';
import { VenueCategories } from '@/components/dashboard/VenueCategories';

export default function DashboardPage() {
  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="space-y-8 sm:space-y-10 lg:space-y-12">
            {/* Welcome Banner/Carousel */}
            <WelcomeBanner />
            
            {/* Popular Venues */}
            <PopularVenues />
            
            {/* Popular Sports */}
            <PopularSports />
            
            {/* Venue Categories */}
            <VenueCategories />
          </div>
        </div>
      </div>
    </Layout>
  );
}
