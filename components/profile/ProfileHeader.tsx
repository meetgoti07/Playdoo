"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield,
  User as UserIcon
} from 'lucide-react';
import { User } from '@/hooks/swr/profile/useProfile';

interface ProfileHeaderProps {
  user: User;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatRole = (role: string) => {
    return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <Avatar className="h-24 w-24">
              <AvatarImage 
                src={user.image || user.userProfile?.avatar} 
                alt={user.name}
              />
              <AvatarFallback className="text-lg font-semibold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="mb-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {user.userProfile?.fullName || user.name}
              </h1>
              {user.userProfile?.bio && (
                <p className="text-gray-600 mt-1">{user.userProfile.bio}</p>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <UserIcon className="w-3 h-3" />
                {formatRole(user.role)}
              </Badge>
              
              <Badge 
                variant={user.status === 'ACTIVE' ? 'default' : 'secondary'}
                className="flex items-center gap-1"
              >
                <Shield className="w-3 h-3" />
                {user.status}
              </Badge>

              {user.emailVerified && (
                <Badge variant="default" className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  Verified Email
                </Badge>
              )}

            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="truncate">{user.email}</span>
              </div>

              {user.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{user.phone}</span>
                </div>
              )}

              {(user.city || user.state) && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="truncate">
                    {[user.city, user.state].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span>
                  Joined {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
