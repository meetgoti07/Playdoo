"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, MapPin, Star, Clock, Users, Zap, Search, Filter } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Image from "next/image";

interface Facility {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  rating: number;
  totalReviews: number;
  minPrice: number;
  availableSports: string[];
  photos: { url: string; caption: string }[];
  courts: {
    id: string;
    name: string;
    sportType: string;
    pricePerHour: number;
    surface: string;
    capacity: number;
  }[];
  amenities: {
    amenity: {
      id: string;
      name: string;
      icon: string;
    };
  }[];
}

interface Court {
  id: string;
  name: string;
  sportType: string;
  description: string;
  pricePerHour: number;
  capacity: number;
  surface: string;
  facility: {
    id: string;
    name: string;
    rating: number;
    totalReviews: number;
  };
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  price: number;
  isBooked: boolean;
  isBlocked: boolean;
  blockReason?: string;
  available: boolean;
}

const SPORT_TYPES = [
  "BADMINTON",
  "TENNIS", 
  "FOOTBALL",
  "BASKETBALL",
  "CRICKET",
  "SQUASH",
  "TABLE_TENNIS",
  "VOLLEYBALL",
  "SWIMMING",
  "GYM",
  "OTHER"
];

export default function BookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedSport, setSelectedSport] = useState("");
  
  // Booking states
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [courts, setCourts] = useState<Court[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Fetch facilities
  const fetchFacilities = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });
      
      if (selectedCity && selectedCity !== "all") params.append("city", selectedCity);
      if (selectedSport && selectedSport !== "all") params.append("sportType", selectedSport);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/facilities?${params}`);
      const data = await response.json();

      if (response.ok) {
        if (page === 1) {
          setFacilities(data.facilities);
        } else {
          setFacilities(prev => [...prev, ...data.facilities]);
        }
        setCurrentPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);
        setHasMore(data.pagination.hasMore);
      } else {
        toast.error(data.error || "Failed to fetch facilities");
      }
    } catch (error) {
      toast.error("Failed to fetch facilities");
    } finally {
      setLoading(false);
    }
  };

  // Fetch courts for selected facility
  const fetchCourts = async (facilityId: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSport && selectedSport !== "all") params.append("sportType", selectedSport);

      const response = await fetch(`/api/facilities/${facilityId}/courts?${params}`);
      const data = await response.json();

      if (response.ok) {
        setCourts(data.courts);
      } else {
        toast.error(data.error || "Failed to fetch courts");
      }
    } catch (error) {
      toast.error("Failed to fetch courts");
    } finally {
      setLoading(false);
    }
  };

  // Fetch time slots for selected court and date
  const fetchTimeSlots = async (courtId: string, date: Date) => {
    setLoading(true);
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const response = await fetch(`/api/courts/${courtId}/time-slots?date=${dateStr}`);
      const data = await response.json();

      if (response.ok) {
        setTimeSlots(data.timeSlots);
      } else {
        toast.error(data.error || "Failed to fetch time slots");
      }
    } catch (error) {
      toast.error("Failed to fetch time slots");
    } finally {
      setLoading(false);
    }
  };

  // Handle facility selection
  const handleFacilitySelect = async (facility: Facility) => {
    setSelectedFacility(facility);
    setSelectedCourt(null);
    setSelectedTimeSlot(null);
    setCourts([]);
    setTimeSlots([]);
    await fetchCourts(facility.id);
    setStep(2);
  };

  // Handle court selection
  const handleCourtSelect = async (court: Court) => {
    setSelectedCourt(court);
    setSelectedTimeSlot(null);
    setTimeSlots([]);
    if (selectedDate) {
      await fetchTimeSlots(court.id, selectedDate);
    }
    setStep(3);
  };

  // Handle date selection
  const handleDateSelect = async (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
    if (date && selectedCourt) {
      await fetchTimeSlots(selectedCourt.id, date);
    }
  };

  // Handle time slot selection and proceed to booking
  const handleTimeSlotSelect = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);
    // Navigate to booking confirmation page with date
    const dateParam = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
    router.push(`/booking/confirm?facilityId=${selectedFacility?.id}&courtId=${selectedCourt?.id}&timeSlotId=${timeSlot.id}&date=${dateParam}`);
  };

  // Load more facilities
  const loadMore = () => {
    if (hasMore && !loading) {
      fetchFacilities(currentPage + 1);
    }
  };

  // Search effect
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchFacilities(1);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCity, selectedSport]);

  // Initial load
  useEffect(() => {
    fetchFacilities();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book a Court</h1>
          <p className="text-gray-600">Find and book sports facilities near you</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { step: 1, title: "Select Facility", active: step >= 1 },
              { step: 2, title: "Choose Court", active: step >= 2 },
              { step: 3, title: "Pick Time", active: step >= 3 },
              { step: 4, title: "Confirm Booking", active: step >= 4 },
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    item.active
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {item.step}
                </div>
                <span className={`ml-2 text-sm ${item.active ? "text-blue-600" : "text-gray-500"}`}>
                  {item.title}
                </span>
                {index < 3 && (
                  <div className="w-12 h-0.5 bg-gray-200 mx-4"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Select Facility */}
        {step === 1 && (
          <div>
            {/* Search and Filter */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search facilities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Cities</SelectItem>
                      <SelectItem value="Mumbai">Mumbai</SelectItem>
                      <SelectItem value="Delhi">Delhi</SelectItem>
                      <SelectItem value="Bangalore">Bangalore</SelectItem>
                      <SelectItem value="Pune">Pune</SelectItem>
                      <SelectItem value="Chennai">Chennai</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedSport} onValueChange={setSelectedSport}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sports</SelectItem>
                      {SPORT_TYPES.map((sport) => (
                        <SelectItem key={sport} value={sport}>
                          {sport.replace("_", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Facilities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {facilities.map((facility) => (
                <Card key={facility.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    {facility.photos[0]?.url ? (
                      <Image
                        src={facility.photos[0].url}
                        alt={facility.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-2">{facility.name}</h3>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      {facility.address}, {facility.city}
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="text-sm font-medium">{facility.rating}</span>
                        <span className="text-xs text-gray-500 ml-1">({facility.totalReviews})</span>
                      </div>
                      <div className="text-sm font-semibold text-green-600">
                        From ₹{facility.minPrice}/hr
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {facility.availableSports.slice(0, 3).map((sport) => (
                        <Badge key={sport} variant="secondary" className="text-xs">
                          {sport.replace("_", " ")}
                        </Badge>
                      ))}
                      {facility.availableSports.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{facility.availableSports.length - 3} more
                        </Badge>
                      )}
                    </div>
                    <Button
                      onClick={() => handleFacilitySelect(facility)}
                      className="w-full"
                    >
                      Select Facility
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-8">
                <Button
                  onClick={loadMore}
                  disabled={loading}
                  variant="outline"
                  className="px-8"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Choose Court */}
        {step === 2 && selectedFacility && (
          <div>
            <div className="mb-6">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="mb-4"
              >
                ← Back to Facilities
              </Button>
              <h2 className="text-2xl font-bold">{selectedFacility.name}</h2>
              <p className="text-gray-600">Choose a court</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courts.map((court) => (
                <Card key={court.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2">{court.name}</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Sport:</span>
                        <Badge variant="secondary">{court.sportType.replace("_", " ")}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Surface:</span>
                        <span className="text-sm font-medium">{court.surface}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Capacity:</span>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">{court.capacity}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Price:</span>
                        <span className="text-lg font-bold text-green-600">₹{court.pricePerHour}/hr</span>
                      </div>
                    </div>
                    {court.description && (
                      <p className="text-sm text-gray-600 mb-4">{court.description}</p>
                    )}
                    <Button
                      onClick={() => handleCourtSelect(court)}
                      className="w-full"
                    >
                      Select Court
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Pick Time */}
        {step === 3 && selectedCourt && (
          <div>
            <div className="mb-6">
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                className="mb-4"
              >
                ← Back to Courts
              </Button>
              <h2 className="text-2xl font-bold">{selectedCourt.name}</h2>
              <p className="text-gray-600">Select date and time</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Calendar */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Date</CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </CardContent>
              </Card>

              {/* Time Slots */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Time Slots</CardTitle>
                  {selectedDate && (
                    <p className="text-sm text-gray-600">
                      {format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : timeSlots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {timeSlots.map((slot) => (
                        <Button
                          key={slot.id}
                          onClick={() => handleTimeSlotSelect(slot)}
                          disabled={!slot.available}
                          variant={slot.available ? "outline" : "secondary"}
                          className={`p-4 h-auto flex flex-col ${
                            !slot.available ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          <div className="flex items-center mb-1">
                            <Clock className="h-4 w-4 mr-1" />
                            <span className="font-medium">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                          <div className="text-sm text-green-600 font-semibold">
                            ₹{slot.price}
                          </div>
                          {!slot.available && (
                            <div className="text-xs text-red-500 mt-1">
                              {slot.isBooked ? "Booked" : slot.blockReason || "Blocked"}
                            </div>
                          )}
                        </Button>
                      ))}
                    </div>
                  ) : selectedDate ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No time slots available for this date</p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Please select a date to view available time slots</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
