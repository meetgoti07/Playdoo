"use client";

import { usePayments } from "@/hooks/swr/admin/usePayments";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MoreHorizontal,
  Eye,
  RefreshCw,
  CreditCard,
  User,
  Building,
  Calendar,
} from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useState } from "react";

interface PaymentFilters {
  status: string;
  method: string;
  dateRange: string;
  search: string;
}

interface PaymentManagementTableProps {
  filters: PaymentFilters;
}

const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-blue-100 text-blue-800",
  CANCELLED: "bg-gray-100 text-gray-800",
};

const methodColors = {
  CREDIT_CARD: "bg-blue-100 text-blue-800",
  DEBIT_CARD: "bg-purple-100 text-purple-800",
  UPI: "bg-green-100 text-green-800",
  NET_BANKING: "bg-indigo-100 text-indigo-800",
  WALLET: "bg-orange-100 text-orange-800",
  CASH: "bg-gray-100 text-gray-800",
};

export function PaymentManagementTable({ filters }: PaymentManagementTableProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, mutate } = usePayments({
    page,
    limit: 20,
    status: filters.status,
    method: filters.method,
    search: filters.search,
    dateRange: filters.dateRange,
  });

  const handleAction = async (paymentId: string, action: string) => {
    try {
      globalThis?.logger?.info({
        meta: {
          requestId: crypto.randomUUID(),
          paymentId,
          action,
        },
        message: `Admin payment action: ${action}`,
      });

      const response = await fetch(`/api/admin/payments/${paymentId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        mutate(); // Refresh the data
      } else {
        throw new Error(`Failed to ${action} payment`);
      }
    } catch (error) {
      globalThis?.logger?.error({
        err: error,
        message: `Failed to ${action} payment`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Failed to load payments. Please try again.
      </div>
    );
  }

  const payments = data?.payments || [];
  const totalCount = data?.totalCount || 0;

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Booking</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Gateway</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment: any) => (
              <TableRow key={payment.id}>
                <TableCell>
                  <div className="font-mono text-sm">
                    {payment.transactionId || payment.hashId}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={payment.booking?.user?.image} />
                      <AvatarFallback>
                        {payment.booking?.user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{payment.booking?.user?.name}</div>
                      <div className="text-sm text-gray-500">
                        {payment.booking?.user?.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {payment.booking?.facility?.name}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Building className="w-3 h-3 mr-1" />
                      {payment.booking?.court?.name}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      {payment.booking?.bookingDate}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {formatCurrency(payment.totalAmount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Amount: {formatCurrency(payment.amount)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Fee: {formatCurrency(payment.platformFee)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    className={methodColors[payment.paymentMethod as keyof typeof methodColors]}
                  >
                    {payment.paymentMethod.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {payment.paymentGateway || "N/A"}
                  </div>
                  {payment.gatewayPaymentId && (
                    <div className="text-xs text-gray-500 font-mono">
                      {payment.gatewayPaymentId}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    className={statusColors[payment.status as keyof typeof statusColors]}
                  >
                    {payment.status}
                  </Badge>
                  {payment.failureReason && (
                    <div className="text-xs text-red-500 mt-1">
                      {payment.failureReason}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1 text-sm">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDateTime(payment.createdAt)}</span>
                  </div>
                  {payment.paidAt && (
                    <div className="text-xs text-green-600">
                      Paid: {formatDateTime(payment.paidAt)}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalCount > 20 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, totalCount)} of{" "}
            {totalCount} payments
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page * 20 >= totalCount}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
