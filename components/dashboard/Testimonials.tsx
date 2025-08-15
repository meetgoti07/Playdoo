"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Quote } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Testimonial {
  id: string;
  name: string;
  avatar?: string;
  rating: number;
  comment: string;
  facility: string;
  location: string;
  sport: string;
  date: string;
}

// Mock testimonials for now - can be replaced with real data later
const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Rahul Sharma',
    avatar: '',
    rating: 5,
    comment: 'Amazing badminton courts! The booking process was seamless and the facilities were top-notch. Definitely coming back!',
    facility: 'SportZone Complex',
    location: 'Mumbai',
    sport: 'Badminton',
    date: '2024-01-15'
  },
  {
    id: '2',
    name: 'Priya Patel',
    avatar: '',
    rating: 5,
    comment: 'Great experience playing tennis here. The courts are well-maintained and the staff is very helpful.',
    facility: 'Elite Tennis Club',
    location: 'Delhi',
    sport: 'Tennis',
    date: '2024-01-10'
  },
  {
    id: '3',
    name: 'Vikram Singh',
    avatar: '',
    rating: 4,
    comment: 'Perfect place for football practice. The ground is in excellent condition and booking was very easy through the app.',
    facility: 'Champions Ground',
    location: 'Bangalore',
    sport: 'Football',
    date: '2024-01-08'
  },
  {
    id: '4',
    name: 'Anita Kumar',
    avatar: '',
    rating: 5,
    comment: 'Love this basketball court! Great location, clean facilities, and easy online booking. Highly recommended!',
    facility: 'Hoop Dreams Arena',
    location: 'Chennai',
    sport: 'Basketball',
    date: '2024-01-05'
  }
];

export function Testimonials() {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What Our Users Say</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Read reviews from thousands of satisfied customers who have booked their favorite sports venues through our platform
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {testimonials.map((testimonial) => (
          <Card key={testimonial.id} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-white">
            <CardContent className="p-6">
              {/* Quote Icon */}
              <div className="mb-4">
                <Quote className="h-8 w-8 text-blue-500 opacity-20" />
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < testimonial.rating
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>

              {/* Comment */}
              <p className="text-gray-700 text-sm mb-6 leading-relaxed line-clamp-4">
                "{testimonial.comment}"
              </p>

              {/* User Info */}
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                  <AvatarFallback className="bg-blue-500 text-white text-sm font-medium">
                    {getInitials(testimonial.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {testimonial.location}
                  </p>
                </div>
              </div>

              {/* Booking Details */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Facility:</span>
                  <span className="font-medium truncate ml-2">{testimonial.facility}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Sport:</span>
                  <span className="font-medium">{testimonial.sport}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Visited:</span>
                  <span>{formatDate(testimonial.date)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Call to Action */}
      <div className="text-center mt-8">
        <p className="text-gray-600 mb-4">Join thousands of happy customers!</p>
        <div className="flex justify-center items-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>10,000+ Bookings</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>500+ Venues</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>4.8★ Average Rating</span>
          </div>
        </div>
      </div>
    </div>
  );
}
