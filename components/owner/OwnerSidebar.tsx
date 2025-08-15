"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Calendar,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  Wrench,
  DollarSign,
  MessageSquare,
  Home,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navigation = [
  {
    name: "Dashboard",
    href: "/owner",
    icon: LayoutDashboard,
  },
  {
    name: "Facilities",
    href: "/owner/facilities",
    icon: Building2,
  },
  {
    name: "Courts",
    href: "/owner/courts",
    icon: Home,
  },
  {
    name: "Bookings",
    href: "/owner/bookings",
    icon: Calendar,
  },
  {
    name: "Schedule",
    href: "/owner/schedule",
    icon: BookOpen,
  },
  {
    name: "Customers",
    href: "/owner/customers",
    icon: Users,
  },
  {
    name: "Analytics",
    href: "/owner/analytics",
    icon: BarChart3,
  },
  {
    name: "Revenue",
    href: "/owner/revenue",
    icon: DollarSign,
  },
  {
    name: "Maintenance",
    href: "/owner/maintenance",
    icon: Wrench,
  },
];

export function OwnerSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Owner Portal</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-6 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            Playdoo Owner Portal
          </div>
        </div>
      )}
    </div>
  );
}
