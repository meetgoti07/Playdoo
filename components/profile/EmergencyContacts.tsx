"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProfile, User, UpdateProfileData } from '@/hooks/swr/profile/useProfile';
import { 
  Phone, 
  User as UserIcon,
  Heart,
  Save,
  Loader2,
  CheckCircle,
  Plus,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

interface EmergencyContactsProps {
  user: User;
}

const relationshipOptions = [
  'Parent',
  'Spouse',
  'Sibling',
  'Child',
  'Friend',
  'Partner',
  'Guardian',
  'Other Family',
  'Colleague',
  'Other'
];

export function EmergencyContacts({ user }: EmergencyContactsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { updateProfile } = useProfile();

  // Parse existing emergency contacts or set defaults
  const parseEmergencyContacts = (): EmergencyContact[] => {
    try {
      const contacts = user.userProfile?.emergencyContact;
      if (typeof contacts === 'string') {
        return JSON.parse(contacts);
      }
      if (Array.isArray(contacts)) {
        return contacts;
      }
      return [{ name: '', phone: '', relationship: '' }];
    } catch {
      return [{ name: '', phone: '', relationship: '' }];
    }
  };

  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>(
    parseEmergencyContacts()
  );

  const addEmergencyContact = () => {
    if (emergencyContacts.length < 3) {
      setEmergencyContacts([...emergencyContacts, { name: '', phone: '', relationship: '' }]);
      setIsSaved(false);
    }
  };

  const removeEmergencyContact = (index: number) => {
    if (emergencyContacts.length > 1) {
      const updated = emergencyContacts.filter((_, i) => i !== index);
      setEmergencyContacts(updated);
      setIsSaved(false);
    }
  };

  const updateEmergencyContact = (index: number, field: keyof EmergencyContact, value: string) => {
    const updated = emergencyContacts.map((contact, i) => 
      i === index ? { ...contact, [field]: value } : contact
    );
    setEmergencyContacts(updated);
    setIsSaved(false);
  };

  const validateContacts = (): boolean => {
    return emergencyContacts.every(contact => 
      contact.name.trim() !== '' && 
      contact.phone.trim() !== '' && 
      contact.relationship.trim() !== ''
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateContacts()) {
      return;
    }

    setIsLoading(true);

    try {
      const formData: UpdateProfileData = {
        emergencyContact: JSON.stringify(emergencyContacts)
      };
      
      await updateProfile(formData);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Failed to update emergency contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = validateContacts() && emergencyContacts.some(contact => 
    contact.name.trim() !== '' || contact.phone.trim() !== '' || contact.relationship.trim() !== ''
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          Emergency Contacts
        </CardTitle>
        <CardDescription>
          Provide emergency contact information for safety purposes. This information will only be used in case of emergencies.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Emergency Contacts List */}
          <div className="space-y-4">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">
                    Emergency Contact {index + 1}
                  </h4>
                  {emergencyContacts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEmergencyContact(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor={`name-${index}`} className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4" />
                      Full Name
                    </Label>
                    <Input
                      id={`name-${index}`}
                      type="text"
                      value={contact.name}
                      onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
                      placeholder="Enter full name"
                      className="w-full"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor={`phone-${index}`} className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </Label>
                    <Input
                      id={`phone-${index}`}
                      type="tel"
                      value={contact.phone}
                      onChange={(e) => updateEmergencyContact(index, 'phone', e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full"
                    />
                  </div>

                  {/* Relationship */}
                  <div className="space-y-2">
                    <Label htmlFor={`relationship-${index}`}>
                      Relationship
                    </Label>
                    <select
                      id={`relationship-${index}`}
                      value={contact.relationship}
                      onChange={(e) => updateEmergencyContact(index, 'relationship', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select relationship</option>
                      {relationshipOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Contact Button */}
          {emergencyContacts.length < 3 && (
            <Button
              type="button"
              variant="outline"
              onClick={addEmergencyContact}
              className="w-full border-dashed"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Emergency Contact
            </Button>
          )}

          {/* Info Alert */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Privacy Notice:</strong> Emergency contact information is securely stored and will only be accessed in case of emergencies during your sports activities. We respect your privacy and will never share this information for marketing purposes.
            </AlertDescription>
          </Alert>

          {/* Validation Error */}
          {!isFormValid && emergencyContacts.some(contact => 
            contact.name.trim() !== '' || contact.phone.trim() !== '' || contact.relationship.trim() !== ''
          ) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please fill in all fields for each emergency contact or remove incomplete entries.
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {isSaved && (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Emergency contacts updated successfully!
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={isLoading || !isFormValid}
              className="min-w-32"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Contacts
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
