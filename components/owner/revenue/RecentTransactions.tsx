"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreditCard, Receipt } from "lucide-react";
import useSWR from "swr";
import { formatDistanceToNow } from "date-fns";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function RecentTransactions() {
  const { data, error, isLoading } = useSWR("/api/owner/revenue", fetcher);

  if (isLoading) {
    return <RecentTransactionsSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Failed to load transactions</p>
        </CardContent>
      </Card>
    );
  }

  const { recentTransactions = [] } = data || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5" />
          Recent Transactions
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Latest payments received from customers
        </p>
      </CardHeader>
      <CardContent>
        {recentTransactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No transactions found
          </p>
        ) : (
          <div className="space-y-4">
            {recentTransactions.map((transaction: any) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src="" />
                    <AvatarFallback>
                      {transaction.customer?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1">
                    <p className="font-medium">{transaction.customer}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{transaction.facility}</span>
                      <span>•</span>
                      <span>{transaction.court}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <CreditCard className="mr-1 h-3 w-3" />
                        {transaction.paymentMethod}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(transaction.paidAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-semibold text-green-600">
                    +₹{transaction.amount.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentTransactionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-40 bg-muted animate-pulse rounded mb-2" />
        <div className="h-4 w-56 bg-muted animate-pulse rounded" />
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
                  <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
