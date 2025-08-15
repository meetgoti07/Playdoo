"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProfile, User, UpdateProfileData } from '@/hooks/swr/profile/useProfile';
import { 
  Bell, 
  Mail, 
  MessageCircle,
  Smartphone,
  Save,
  Loader2,
  CheckCircle,
  Volume2
} from 'lucide-react';

interface NotificationSettingsProps {
  user: User;
}

export function NotificationSettings({ user }: NotificationSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { updateProfile } = useProfile();

  const [formData, setFormData] = useState<UpdateProfileData>({
    emailNotifications: user.userProfile?.emailNotifications ?? true,
    smsNotifications: user.userProfile?.smsNotifications ?? false,
    pushNotifications: user.userProfile?.pushNotifications ?? true,
  });

  const handleToggle = (field: keyof UpdateProfileData) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
    setIsSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateProfile(formData);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const notificationTypes = [
    {
      id: 'emailNotifications',
      label: 'Email Notifications',
      description: 'Receive booking confirmations, updates, and important announcements via email',
      icon: Mail,
      enabled: formData.emailNotifications,
      examples: ['Booking confirmations', 'Payment receipts', 'Schedule changes', 'Promotional offers']
    },
    {
      id: 'smsNotifications',
      label: 'SMS Notifications',
      description: 'Get instant updates and reminders via text message',
      icon: MessageCircle,
      enabled: formData.smsNotifications,
      examples: ['Booking reminders', 'Payment confirmations', 'Emergency alerts', 'Last-minute cancellations']
    },
    {
      id: 'pushNotifications',
      label: 'Push Notifications',
      description: 'Receive real-time updates through your browser or mobile app',
      icon: Smartphone,
      enabled: formData.pushNotifications,
      examples: ['Live booking updates', 'New venue notifications', 'Special deals', 'Weather alerts']
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Manage how you receive updates about your bookings, payments, and other important information.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Notification Types */}
          <div className="space-y-4">
            {notificationTypes.map((notification) => {
              const IconComponent = notification.icon;
              return (
                <div key={notification.id} className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <IconComponent className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <Label 
                            htmlFor={notification.id}
                            className="text-base font-medium cursor-pointer"
                          >
                            {notification.label}
                          </Label>
                          <Switch
                            id={notification.id}
                            checked={notification.enabled}
                            onCheckedChange={() => handleToggle(notification.id as keyof UpdateProfileData)}
                          />
                        </div>
                        <p className="text-sm text-gray-600">
                          {notification.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Examples - only show when enabled */}
                  {notification.enabled && (
                    <div className="ml-12 space-y-2">
                      <h5 className="text-sm font-medium text-gray-700">You'll receive:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {notification.examples.map((example, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Important Notes */}
          <div className="space-y-4">
            <Alert>
              <Volume2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Critical notifications (like emergency alerts and security updates) will always be sent via email regardless of your preferences to ensure your safety and account security.
              </AlertDescription>
            </Alert>

            {/* Phone Verification Notice */}
            {!user.isPhoneVerified && formData.smsNotifications && (
              <Alert variant="destructive">
                <MessageCircle className="h-4 w-4" />
                <AlertDescription>
                  SMS notifications require phone verification. Please verify your phone number in your profile settings to receive text messages.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Success Message */}
          {isSaved && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Notification settings updated successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isLoading} className="min-w-32">
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
