"use client";

import { useState, useMemo } from 'react';
import { useMyBookings, useBookingStats } from '@/hooks/swr/bookings/useMyBookings';
import { BookingStatus } from '@/lib/generated/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookingCard } from './BookingCard';
import { BookingStatsCards } from './BookingStatsCards';
import { 
  Calendar, 
  Filter, 
  Download,
  Search,
  CalendarDays,
  Clock,
  AlertCircle
} from 'lucide-react';

export function BookingDashboard() {
  const [filters, setFilters] = useState({
    status: 'all' as string,
    startDate: '',
    endDate: '',
    page: 1,
  });

  const { 
    bookings, 
    totalCount, 
    totalPages, 
    currentPage, 
    hasNextPage, 
    hasPreviousPage,
    isLoading, 
    error, 
    mutate 
  } = useMyBookings({
    ...filters,
    status: filters.status === 'all' ? undefined : filters.status as BookingStatus
  });

  const { stats, isLoading: statsLoading } = useBookingStats();

  // Filter bookings by type for quick access
  const upcomingBookings = useMemo(() => {
    if (!bookings || bookings.length === 0) return [];
    
    const now = new Date();
    return bookings.filter(booking => {
      if (!booking || booking.status !== BookingStatus.CONFIRMED) return false;
      
      if (!booking.bookingDate || !booking.startTime) return false;
      
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
          console.warn('Invalid booking date/time for upcoming filter:', booking.bookingDate, booking.startTime);
          return false;
        }
        
        return bookingDateTime > now;
      } catch (error) {
        console.error('Error filtering upcoming bookings:', error);
        return false;
      }
    });
  }, [bookings]);

  const todayBookings = useMemo(() => {
    if (!bookings || bookings.length === 0) return [];
    
    const today = new Date().toISOString().split('T')[0];
    return bookings.filter(booking => {
      if (!booking || !booking.bookingDate) return false;
      
      try {
        // Handle different date formats
        let bookingDateString = booking.bookingDate;
        if (bookingDateString.includes('T')) {
          bookingDateString = bookingDateString.split('T')[0];
        }
        
        return bookingDateString === today;
      } catch (error) {
        console.error('Error filtering today bookings:', error);
        return false;
      }
    });
  }, [bookings]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      startDate: '',
      endDate: '',
      page: 1,
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load bookings. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && typeof stats === 'object' && 'totalBookings' in stats ? (
        <BookingStatsCards stats={stats} isLoading={statsLoading} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-200 animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarDays className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{todayBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Download className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Bookings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={filters.status || 'all'} 
                onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value={BookingStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={BookingStatus.CONFIRMED}>Confirmed</SelectItem>
                  <SelectItem value={BookingStatus.CANCELLED}>Cancelled</SelectItem>
                  <SelectItem value={BookingStatus.COMPLETED}>Completed</SelectItem>
                  <SelectItem value={BookingStatus.NO_SHOW}>No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">From Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">To Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle>My Bookings</CardTitle>
          <CardDescription>
            {totalCount > 0 
              ? `Showing ${bookings.length} of ${totalCount} bookings`
              : 'No bookings found'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-500">
                {Object.values(filters).some(v => v) 
                  ? 'Try adjusting your filters to see more results.'
                  : 'You haven\'t made any bookings yet.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <BookingCard 
                  key={booking.id} 
                  booking={booking} 
                  onUpdate={mutate}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!hasPreviousPage}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!hasNextPage}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
