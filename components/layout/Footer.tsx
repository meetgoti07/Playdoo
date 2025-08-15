"use client";

import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';

export function Footer() {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubscribing(true);
    try {
      // TODO: Implement newsletter subscription API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Successfully subscribed to newsletter!');
      setEmail('');
    } catch (error) {
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const quickLinks = [
    { name: 'Home', href: '/' },
    { name: 'Search Venues', href: '/search' },
    { name: 'My Bookings', href: '/bookings' },
    { name: 'Popular Sports', href: '/sports' },
    { name: 'Cities', href: '/cities' },
  ];

  const sportsLinks = [
    { name: 'Badminton Courts', href: '/search?sport=BADMINTON' },
    { name: 'Tennis Courts', href: '/search?sport=TENNIS' },
    { name: 'Football Grounds', href: '/search?sport=FOOTBALL' },
    { name: 'Basketball Courts', href: '/search?sport=BASKETBALL' },
    { name: 'Cricket Nets', href: '/search?sport=CRICKET' },
    { name: 'Swimming Pools', href: '/search?sport=SWIMMING' },
  ];

  const supportLinks = [
    { name: 'Help Center', href: '/help' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Booking Policy', href: '/booking-policy' },
    { name: 'Cancellation Policy', href: '/cancellation-policy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Privacy Policy', href: '/privacy' },
  ];

  const socialLinks = [
    { name: 'Facebook', href: '#', icon: Facebook },
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'Instagram', href: '#', icon: Instagram },
    { name: 'YouTube', href: '#', icon: Youtube },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <span className="text-xl font-bold">QuickCourt</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              India's leading sports venue booking platform. Find and book courts, 
              grounds, and sports facilities in your city instantly.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">+91 98765 43210</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">support@quickcourt.com</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">Mumbai, India</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <Link
                    key={social.name}
                    href={social.href}
                    className="text-gray-400 hover:text-white transition-colors"
                    aria-label={social.name}
                  >
                    <IconComponent className="h-5 w-5" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sports */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Popular Sports</h3>
            <ul className="space-y-2">
              {sportsLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter & Support */}
          <div className="space-y-6">
            {/* Newsletter Signup */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Stay Updated</h3>
              <p className="text-gray-300 text-sm mb-3">
                Get the latest updates on new venues and offers.
              </p>
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                  required
                />
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubscribing}
                >
                  {isSubscribing ? 'Subscribing...' : 'Subscribe'}
                </Button>
              </form>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                {supportLinks.slice(0, 4).map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-400">
              © {new Date().getFullYear()} QuickCourt. All rights reserved.
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-end space-x-6 text-sm">
              {supportLinks.slice(-3).map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Business Info */}
        <div className="border-t border-gray-800 py-4">
          <div className="text-center text-xs text-gray-500">
            <p>
              QuickCourt is a registered trademark. All sports venue bookings are subject to availability and venue policies.
            </p>
            <p className="mt-1">
              For business inquiries: business@quickcourt.com | Partner with us: partners@quickcourt.com
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
