"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  User, 
  LogOut, 
  Settings, 
  Calendar,
  Heart,
  Menu,
  X,
  MapPin,
  Zap,
  Building,
  HelpCircle
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';

interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role?: string | null;
  };
}

interface SearchSuggestion {
  type: 'facility' | 'location';
  name: string;
  id: string;
  subtitle?: string;
  text: string;
}

export function Header() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data } = await authClient.getSession();
        setSession(data);
      } catch (error) {
        console.error('Failed to get session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();
  }, []);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchQuery)}&size=5`);
      const data = await response.json();

      if (response.ok && data.suggestions) {
        setSuggestions(data.suggestions);
        setShowSuggestions(data.suggestions.length > 0);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Suggestions request failed:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  useEffect(() => {
    const suggestionsTimer = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300);

    return () => clearTimeout(suggestionsTimer);
  }, [searchQuery, fetchSuggestions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.text);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    router.push(`/search?q=${encodeURIComponent(suggestion.text)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch(e);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        } else {
          handleSearch(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success('Signed out successfully');
            setSession(null);
            router.push('/');
          }
        }
      });
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const navigationItems = [
    { name: 'Home', href: '/' },
    { name: 'Venues', href: '/venues' },
    { name: 'Bookings', href: '/bookings' },
  ];

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Playdoo</span>
            </Link>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-lg mx-8">
            <form onSubmit={handleSearch} className="w-full relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search venues, sports, locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0 && searchQuery.length >= 2) {
                      setShowSuggestions(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 150);
                  }}
                  onKeyDown={handleKeyDown}
                  className="pl-10 pr-10 w-full"
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              
              {/* Search Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1 max-h-64 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.type}-${suggestion.id}-${index}`}
                      type="button"
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                        index === selectedSuggestionIndex ? 'bg-blue-50 text-blue-900' : ''
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowSuggestions(false);
                        handleSuggestionClick(suggestion);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {suggestion.type === 'facility' ? (
                          <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                            <Building className="w-3 h-3 text-blue-600" />
                          </div>
                        ) : (
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-gray-900 font-medium block truncate">{suggestion.name}</span>
                          {suggestion.subtitle && (
                            <div className="text-xs text-gray-500 truncate">{suggestion.subtitle}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </form>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Button - Mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => {
                setIsMobileMenuOpen(true);
              }}
            >
              <Search className="h-5 w-5" />
            </Button>

            {isLoading ? (
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            ) : session ? (
              // Authenticated User Menu
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-gray-100">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={session.user.image || undefined} alt={session.user.name} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                        {session.user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer w-full">
                      <User className="mr-3 h-4 w-4" />
                      <span>My Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/bookings" className="cursor-pointer w-full">
                      <Calendar className="mr-3 h-4 w-4" />
                      <span>My Bookings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/support" className="cursor-pointer w-full">
                      <HelpCircle className="mr-3 h-4 w-4" />
                      <span>Support</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleSignOut} 
                    className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 focus:bg-red-50 focus:text-red-700"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // Guest User Actions
              <div className="flex items-center space-x-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-gray-700 hover:text-blue-600">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white px-4">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t">
              {/* Mobile Search */}
              <div className="px-3 py-2">
                <form onSubmit={handleSearch} className="relative">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      type="text"
                      placeholder="Search venues..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => {
                        if (suggestions.length > 0 && searchQuery.length >= 2) {
                          setShowSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowSuggestions(false), 150);
                      }}
                      onKeyDown={handleKeyDown}
                      className="pl-10 pr-10 w-full"
                      autoComplete="off"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={clearSearch}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>
                  
                  {/* Mobile Search Suggestions */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1 max-h-48 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={`mobile-${suggestion.type}-${suggestion.id}-${index}`}
                          type="button"
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowSuggestions(false);
                            setIsMobileMenuOpen(false);
                            handleSuggestionClick(suggestion);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {suggestion.type === 'facility' ? (
                              <Building className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            ) : (
                              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium block truncate">{suggestion.name}</span>
                              {suggestion.subtitle && (
                                <div className="text-xs text-gray-500 truncate">{suggestion.subtitle}</div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </form>
              </div>

              {/* Mobile Navigation */}
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile Auth Actions */}
              {!session && (
                <div className="px-3 py-2 space-y-2 border-t border-gray-200 mt-2">
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full text-gray-700 border-gray-300 hover:bg-gray-50">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
