"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Settings, Users, BarChart3 } from "lucide-react";
import Link from "next/link";

export function QuickActions() {
  const actions = [
    {
      title: "Add New Facility",
      description: "Register a new sports facility",
      icon: Plus,
      href: "/owner/facilities/new",
      color: "bg-blue-50 text-blue-600 hover:bg-blue-200 hover:text-blue-700",
    },
    {
      title: "Manage Schedule",
      description: "View and manage court availability",
      icon: Calendar,
      href: "/owner/schedule",
      color: "bg-green-50 text-green-600 hover:bg-green-200 hover:text-green-700",
    },
    {
      title: "View Analytics",
      description: "Check performance insights",
      icon: BarChart3,
      href: "/owner/analytics",
      color: "bg-purple-50 text-purple-600 hover:bg-purple-200 hover:text-purple-700",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              className={`w-full justify-start h-auto p-3 ${action.color}`}
              asChild
            >
              <Link href={action.href}>
                <div className="flex items-start space-x-3">
                  <action.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {action.description}
                    </div>
                  </div>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
