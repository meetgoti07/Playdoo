"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Building2, 
  Calendar, 
  Shield, 
  Settings, 
  FileText,
  MessageSquare,
  Tag,
} from "lucide-react";
import Link from "next/link";

const quickActions = [
  {
    title: "Manage Users",
    description: "View and manage all platform users",
    href: "/admin/users",
    icon: Users,
    bgColor: "bg-blue-500",
    hoverColor: "hover:bg-blue-50",
    borderColor: "hover:border-blue-200",
    iconColor: "text-blue-500",
  },
  {
    title: "Approve Facilities",
    description: "Review pending facility approvals",
    href: "/admin/facilities/pending",
    icon: Building2,
    bgColor: "bg-green-500",
    hoverColor: "hover:bg-green-50",
    borderColor: "hover:border-green-200",
    iconColor: "text-green-500",
  },
  {
    title: "View Bookings",
    description: "Monitor all platform bookings",
    href: "/admin/bookings",
    icon: Calendar,
    bgColor: "bg-orange-500",
    hoverColor: "hover:bg-orange-50",
    borderColor: "hover:border-orange-200",
    iconColor: "text-orange-500",
  },
  {
    title: "Handle Reports",
    description: "Review user reports and take action",
    href: "/admin/reports",
    icon: Shield,
    bgColor: "bg-red-500",
    hoverColor: "hover:bg-red-50",
    borderColor: "hover:border-red-200",
    iconColor: "text-red-500",
  },
  {
    title: "Support Tickets",
    description: "Respond to user support requests",
    href: "/admin/support",
    icon: MessageSquare,
    bgColor: "bg-yellow-500",
    hoverColor: "hover:bg-yellow-50",
    borderColor: "hover:border-yellow-200",
    iconColor: "text-yellow-500",
  },
  {
    title: "Manage Coupons",
    description: "Create and manage promotional coupons",
    href: "/admin/coupons",
    icon: Tag,
    bgColor: "bg-pink-500",
    hoverColor: "hover:bg-pink-50",
    borderColor: "hover:border-pink-200",
    iconColor: "text-pink-500",
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          
          return (
            <Link key={action.href} href={action.href} className="group">
              <div
                className={`
                  relative p-4 border border-gray-200 rounded-lg 
                  transition-all duration-200 ease-in-out
                  ${action.hoverColor} ${action.borderColor}
                  hover:shadow-lg hover:shadow-gray-100
                  hover:-translate-y-1 cursor-pointer
                  h-[140px] flex flex-col justify-between
                `}
              >
                <div className="space-y-3 flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-lg ${action.bgColor} transition-colors duration-200`}>
                      <Icon className="w-5 h-5 text-white transition-colors duration-200" />
                    </div>
                    <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                      {action.title}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed overflow-hidden" 
                     style={{
                       display: '-webkit-box',
                       WebkitLineClamp: 2,
                       WebkitBoxOrient: 'vertical',
                     }}>
                    {action.description}
                  </p>
                </div>
                
                {/* Subtle arrow indicator */}
                <div className="flex justify-end mt-2">
                  <div className="w-5 h-5 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors duration-200">
                    <svg 
                      className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
