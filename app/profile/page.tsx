"use client";

import { useState } from 'react';
import { useProfile } from '@/hooks/swr/profile/useProfile';
import { Layout } from '@/components/layout/Layout';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { ProfileImageUpload } from '@/components/profile/ProfileImageUpload';
import { NotificationSettings } from '@/components/profile/NotificationSettings';
import { SportsPreferences } from '@/components/profile/SportsPreferences';
import { EmergencyContacts } from '@/components/profile/EmergencyContacts';
import { UserReportsPage } from '@/components/profile/UserReportsPage';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Settings, 
  Bell, 
  Activity, 
  Shield, 
  MapPin,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  Flag
} from 'lucide-react';

export default function ProfilePage() {
  const { user, isLoading, error } = useProfile();
  const [activeTab, setActiveTab] = useState('personal');

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-6">
          <div className="max-w-4xl mx-auto px-4">
            <ProfilePageSkeleton />
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-6">
          <div className="max-w-4xl mx-auto px-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load profile. Please try refreshing the page.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-3 sm:py-6">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          {/* Profile Header */}
          <ProfileHeader user={user} />

          {/* Main Content */}
          <div className="mt-4 sm:mt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              {/* Tab Navigation */}
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
                <TabsTrigger value="personal" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Personal</span>
                </TabsTrigger>
                <TabsTrigger value="preferences" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3">
                  <Activity className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Sports</span>
                </TabsTrigger>
                <TabsTrigger value="emergency" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Emergency</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3">
                  <Flag className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">Reports</span>
                </TabsTrigger>
              </TabsList>

              {/* Personal Information */}
              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Profile Image Upload */}
                  <div className="lg:col-span-1">
                    <ProfileImageUpload user={user} />
                  </div>

                  {/* Personal Information Form */}
                  <div className="lg:col-span-2">
                    <ProfileForm user={user} />
                  </div>
                </div>
              </TabsContent>

              {/* Sports Preferences */}
              <TabsContent value="preferences">
                <SportsPreferences user={user} />
              </TabsContent>

              {/* Emergency Contacts */}
              <TabsContent value="emergency">
                <EmergencyContacts user={user} />
              </TabsContent>

              {/* Reports */}
              <TabsContent value="reports">
                <UserReportsPage />
              </TabsContent>

            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function ProfilePageSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full" />
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
