"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProfile, User, UpdateProfileData } from '@/hooks/swr/profile/useProfile';
import { 
  Activity, 
  MapPin, 
  IndianRupee, 
  Save,
  Loader2,
  CheckCircle,
  X
} from 'lucide-react';

interface SportsPreferencesProps {
  user: User;
}

const availableSports = [
  { value: 'BADMINTON', label: 'Badminton', icon: '🏸' },
  { value: 'TENNIS', label: 'Tennis', icon: '🎾' },
  { value: 'FOOTBALL', label: 'Football', icon: '⚽' },
  { value: 'BASKETBALL', label: 'Basketball', icon: '🏀' },
  { value: 'CRICKET', label: 'Cricket', icon: '🏏' },
  { value: 'SQUASH', label: 'Squash', icon: '🏓' },
  { value: 'TABLE_TENNIS', label: 'Table Tennis', icon: '🏓' },
  { value: 'VOLLEYBALL', label: 'Volleyball', icon: '🏐' },
  { value: 'SWIMMING', label: 'Swimming', icon: '🏊' },
  { value: 'GYM', label: 'Gym', icon: '💪' },
  { value: 'OTHER', label: 'Other', icon: '🏃' },
];

export function SportsPreferences({ user }: SportsPreferencesProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { updateProfile } = useProfile();

  const [formData, setFormData] = useState<UpdateProfileData>({
    preferredSports: user.userProfile?.preferredSports || [],
    maxDistance: user.userProfile?.maxDistance || 25,
    priceRangeMin: user.userProfile?.priceRangeMin || 200,
    priceRangeMax: user.userProfile?.priceRangeMax || 2000,
  });

  const handleSportToggle = (sportValue: string) => {
    const currentSports = formData.preferredSports || [];
    const updatedSports = currentSports.includes(sportValue)
      ? currentSports.filter(sport => sport !== sportValue)
      : [...currentSports, sportValue];
    
    setFormData(prev => ({ ...prev, preferredSports: updatedSports }));
    setIsSaved(false);
  };

  const handleDistanceChange = (values: number[]) => {
    setFormData(prev => ({ ...prev, maxDistance: values[0] }));
    setIsSaved(false);
  };

  const handlePriceRangeChange = (values: number[]) => {
    setFormData(prev => ({ 
      ...prev, 
      priceRangeMin: values[0], 
      priceRangeMax: values[1] 
    }));
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
      console.error('Failed to update sports preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Sports Preferences
        </CardTitle>
        <CardDescription>
          Set your favorite sports and booking preferences to get personalized recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Preferred Sports */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Preferred Sports</Label>
            <p className="text-sm text-gray-600">
              Select the sports you're interested in playing
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableSports.map((sport) => {
                const isSelected = formData.preferredSports?.includes(sport.value);
                return (
                  <button
                    key={sport.value}
                    type="button"
                    onClick={() => handleSportToggle(sport.value)}
                    className={`
                      p-3 rounded-lg border-2 transition-all duration-200 text-left
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{sport.icon}</span>
                      <span className="text-sm font-medium">{sport.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Sports Display */}
            {formData.preferredSports && formData.preferredSports.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">Selected Sports:</Label>
                <div className="flex flex-wrap gap-2">
                  {formData.preferredSports.map((sportValue) => {
                    const sport = availableSports.find(s => s.value === sportValue);
                    return sport ? (
                      <Badge key={sportValue} variant="default" className="flex items-center gap-1">
                        <span>{sport.icon}</span>
                        <span>{sport.label}</span>
                        <button
                          type="button"
                          onClick={() => handleSportToggle(sportValue)}
                          className="ml-1 hover:bg-blue-700 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Maximum Travel Distance */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-base font-medium">
              <MapPin className="w-4 h-4" />
              Maximum Travel Distance
            </Label>
            <p className="text-sm text-gray-600">
              How far are you willing to travel to play sports?
            </p>
            
            <div className="space-y-4">
              <Slider
                value={[formData.maxDistance || 25]}
                onValueChange={handleDistanceChange}
                min={1}
                max={100}
                step={1}
                className="w-full"
              />
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>1 km</span>
                <div className="flex items-center space-x-1">
                  <Input
                    type="number"
                    value={formData.maxDistance || 25}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      maxDistance: parseInt(e.target.value) || 25 
                    }))}
                    min={1}
                    max={100}
                    className="w-20 h-8 text-center"
                  />
                  <span>km</span>
                </div>
                <span>100 km</span>
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-base font-medium">
              <IndianRupee className="w-4 h-4" />
              Preferred Price Range (per hour)
            </Label>
            <p className="text-sm text-gray-600">
              Set your comfortable price range for booking sports facilities
            </p>
            
            <div className="space-y-4">
              <Slider
                value={[formData.priceRangeMin || 200, formData.priceRangeMax || 2000]}
                onValueChange={handlePriceRangeChange}
                min={100}
                max={5000}
                step={50}
                className="w-full"
              />
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>₹100</span>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <span>₹</span>
                    <Input
                      type="number"
                      value={formData.priceRangeMin || 200}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        priceRangeMin: parseInt(e.target.value) || 200 
                      }))}
                      min={100}
                      max={4950}
                      className="w-20 h-8 text-center"
                    />
                  </div>
                  <span>-</span>
                  <div className="flex items-center space-x-1">
                    <span>₹</span>
                    <Input
                      type="number"
                      value={formData.priceRangeMax || 2000}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        priceRangeMax: parseInt(e.target.value) || 2000 
                      }))}
                      min={150}
                      max={5000}
                      className="w-20 h-8 text-center"
                    />
                  </div>
                </div>
                <span>₹5000</span>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {isSaved && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Sports preferences updated successfully!
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
                  Save Preferences
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
