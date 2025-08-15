"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  UserAnalyticsHeader,
  UserAnalyticsStats,
  UserAnalyticsCharts,
  UserBookingHistory,
  UserActivityTimeline
} from "@/components/admin/users/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function UserAnalyticsPage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1), // Start of current year
    to: new Date(),
  });

  if (!userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">No User Selected</h2>
          <p className="text-gray-600 mt-2">Please select a user to view analytics</p>
        </div>
        <Link href="/admin/users">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center space-x-4">
        <Link href="/admin/users">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </Link>
      </div>

      {/* User Header with Basic Info */}
      <UserAnalyticsHeader userId={userId} />

      {/* Analytics Stats Cards */}
      <UserAnalyticsStats userId={userId} dateRange={dateRange} />

      {/* Main Analytics Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Booking History</TabsTrigger>
          <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <UserAnalyticsCharts userId={userId} dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking History</CardTitle>
            </CardHeader>
            <CardContent>
              <UserBookingHistory userId={userId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <UserActivityTimeline userId={userId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Analysis of user's booking behavior, preferred times, and sports preferences.
                  </div>
                  {/* Additional insights content can be added here */}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Suggested actions based on user activity and engagement.
                  </div>
                  {/* Recommendations content can be added here */}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
