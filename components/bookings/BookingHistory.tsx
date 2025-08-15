"use client";

import { useState, useMemo } from 'react';
import { useMyBookings } from '@/hooks/swr/bookings/useMyBookings';
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
import { ReviewDialog } from './ReviewDialog';
import { 
  History, 
  Filter, 
  Download,
  Star,
  Calendar,
  AlertCircle,
  FileText
} from 'lucide-react';

export function BookingHistory() {
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

  // Filter for past bookings only
  const pastBookings = useMemo(() => {
    const now = new Date();
    return bookings.filter(booking => {
      if (!booking.bookingDate || !booking.endTime) return false;
      
      try {
        let endTimeString = booking.endTime;
        
        // Handle different time formats
        if (endTimeString.includes('T')) {
          endTimeString = endTimeString.split('T')[1]?.split('.')[0] || endTimeString;
        }
        
        // Remove any timezone info if present
        endTimeString = endTimeString.split('+')[0].split('Z')[0];
        
        const bookingDateTime = new Date(`${booking.bookingDate}T${endTimeString}`);
        
        // Check if the date is valid
        if (isNaN(bookingDateTime.getTime())) {
          console.warn('Invalid booking date/time for past filter:', booking.bookingDate, booking.endTime);
          return false;
        }
        
        return bookingDateTime <= now;
      } catch (error) {
        console.error('Error filtering past bookings:', error);
        return false;
      }
    });
  }, [bookings]);

  // Group bookings by month for better organization
  const groupedBookings = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    
    pastBookings.forEach(booking => {
      if (!booking.bookingDate) return;
      
      try {
        const date = new Date(booking.bookingDate);
        
        // Check if the date is valid
        if (isNaN(date.getTime())) {
          console.warn('Invalid booking date for grouping:', booking.bookingDate);
          return;
        }
        
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        
        if (!groups[monthKey]) {
          groups[monthKey] = [];
        }
        groups[monthKey].push({ ...booking, monthName });
      } catch (error) {
        console.error('Error grouping booking by month:', error);
      }
    });
    
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [pastBookings]);

  // Statistics for completed bookings
  const historyStats = useMemo(() => {
    const completed = pastBookings.filter(b => b.status === BookingStatus.COMPLETED);
    const cancelled = pastBookings.filter(b => b.status === BookingStatus.CANCELLED);
    const reviewed = pastBookings.filter(b => b.review);
    const totalSpent = completed.reduce((sum, b) => sum + b.finalAmount, 0);
    
    return {
      totalCompleted: completed.length,
      totalCancelled: cancelled.length,
      totalReviewed: reviewed.length,
      totalSpent,
      reviewPercentage: completed.length > 0 ? Math.round((reviewed.length / completed.length) * 100) : 0
    };
  }, [pastBookings]);

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

  const downloadHistory = () => {
    // TODO: Implement history download as CSV/PDF
    alert("History download will be implemented soon");
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load booking history. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* History Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{historyStats.totalCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Calendar className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900">{historyStats.totalCancelled}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Reviewed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {historyStats.totalReviewed}
                  <span className="text-sm text-gray-500 ml-1">
                    ({historyStats.reviewPercentage}%)
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">₹{historyStats.totalSpent.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center h-full">
              <Button
                onClick={downloadHistory}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter History
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
                  <SelectItem value={BookingStatus.COMPLETED}>Completed</SelectItem>
                  <SelectItem value={BookingStatus.CANCELLED}>Cancelled</SelectItem>
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

      {/* Booking History */}
      <div className="space-y-6">
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
        ) : groupedBookings.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No booking history</h3>
              <p className="text-gray-500">
                {Object.values(filters).some(v => v) 
                  ? 'No bookings found matching your filters.'
                  : 'Your completed and past bookings will appear here.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          groupedBookings.map(([monthKey, monthBookings]) => (
            <Card key={monthKey}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {monthBookings[0]?.monthName}
                </CardTitle>
                <CardDescription>
                  {monthBookings.length} booking{monthBookings.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthBookings.map((booking) => (
                    <div key={booking.id} className="relative">
                      <BookingCard 
                        booking={booking} 
                        onUpdate={mutate}
                      />
                      
                      {/* Review Button for Completed Bookings */}
                      {booking.status === BookingStatus.COMPLETED && !booking.review && (
                        <div className="absolute top-4 right-4">
                          <ReviewDialog 
                            booking={booking}
                            onReviewSubmitted={mutate}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
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
      </div>
    </div>
  );
}
