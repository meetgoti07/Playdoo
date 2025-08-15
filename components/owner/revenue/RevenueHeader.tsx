"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Download, DollarSign } from "lucide-react";
import { useState } from "react";

export function RevenueHeader() {
  const [period, setPeriod] = useState("month");

  return (
    <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Revenue</h1>
        <p className="text-muted-foreground">
          Track and analyze your facility revenue and transactions
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" size="sm">
          <Calendar className="mr-2 h-4 w-4" />
          Date Range
        </Button>
        
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>
    </div>
  );
}
