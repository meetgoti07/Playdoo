"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Mail, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import useSWR from "swr";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function CustomersList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: "10",
    ...(search && { search }),
    sortBy,
    sortOrder,
  });

  const { data, error, isLoading } = useSWR(
    `/api/owner/customers?${queryParams.toString()}`,
    fetcher
  );

  if (isLoading) {
    return <CustomersListSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load customers</p>
        </CardContent>
      </Card>
    );
  }

  const { customers = [], pagination = {} } = data || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer List</CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage your facility customers and their booking history
        </p>
      </CardHeader>
      <CardContent>
        {customers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No customers found</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Booking</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer: any) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={customer.image} />
                          <AvatarFallback>
                            {customer.name?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {customer.id.slice(-8)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3" />
                          <span className="truncate max-w-48">{customer.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="secondary">
                        {customer.totalBookings} bookings
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="font-medium">
                        ₹{customer.totalSpent.toLocaleString()}
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {customer.lastBooking ? (
                        <div className="space-y-1">
                          <div className="text-sm">
                            {formatDistanceToNow(new Date(customer.lastBooking.date), { addSuffix: true })}
                          </div>
                          <Badge 
                            variant={customer.lastBooking.status === "COMPLETED" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {customer.lastBooking.status}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No bookings</span>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(customer.createdAt), { addSuffix: true })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, pagination.total)} of {pagination.total} customers
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="text-sm">
                  Page {page} of {pagination.pages}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= pagination.pages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function CustomersListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-64 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-muted animate-pulse rounded-full" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-48 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-3 w-16 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
