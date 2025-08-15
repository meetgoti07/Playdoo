"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  Settings,
  BarChart3,
  Shield,
  HelpCircle,
  MessageSquare,
  Trophy,
  CreditCard,
  FileText,
  MapPin,
  Tag,
  Mail,
  ChevronDown,
  ChevronRight,
  LogOut,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { authClient } from "@/lib/auth-client";

const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    title: "User Management",
    icon: Users,
    items: [
      { title: "All Users", href: "/admin/users" },
    ],
  },
  {
    title: "Facility Management",
    icon: Building2,
    items: [
      { title: "All Facilities", href: "/admin/facilities" },
      { title: "Pending Approvals", href: "/admin/facilities/pending" },
    ],
  },
  {
    title: "Court Management",
    icon: Home,
    items: [
      { title: "All Courts", href: "/admin/courts" },
      { title: "Court Analytics", href: "/admin/courts/analytics" },
    ],
  },
  {
    title: "Booking Management",
    icon: Calendar,
    items: [
      { title: "All Bookings", href: "/admin/bookings" },
    ],
  },
  {
    title: "Financial Management",
    icon: CreditCard,
    items: [
      { title: "Payments", href: "/admin/payments" },
    
      { title: "Coupons", href: "/admin/coupons" },
    ],
  },
  {
    title: "Reports & Moderation",
    icon: Shield,
    items: [
      { title: "User Reports", href: "/admin/reports" },
    ],
  },
  {
    title: "Support & Help",
    icon: HelpCircle,
    items: [
      { title: "Support Tickets", href: "/admin/support" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (title: string) => {
    setOpenItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActiveItem = (item: any) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname === item.href || pathname.startsWith(item.href + "/");
  };

  const isActiveParent = (items: any[]) => {
    return items.some(item => isActiveItem(item));
  };

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/admin" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Admin Portal</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-6 space-y-1 overflow-y-auto">
        {adminNavItems.map((item) => {
          if (item.items) {
            const isOpen = openItems.includes(item.title);
            const isActive = isActiveParent(item.items);

            return (
              <Collapsible key={item.title} open={isOpen} onOpenChange={() => toggleItem(item.title)}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-between text-left font-medium px-3 py-2.5 h-auto",
                      isActive && "bg-blue-50 text-blue-700"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 ml-4 mt-1">
                  {item.items.map((subItem) => (
                    <Link key={subItem.href} href={subItem.href}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "w-full justify-start text-left font-normal px-3 py-2 h-auto",
                          isActiveItem(subItem) && "bg-blue-50 text-blue-700"
                        )}
                      >
                        {subItem.title}
                      </Button>
                    </Link>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          }

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left font-medium px-3 py-2.5 h-auto",
                  isActiveItem(item) && "bg-blue-50 text-blue-700"
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.title}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-6 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start text-left font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2.5"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </div>
  );
}
