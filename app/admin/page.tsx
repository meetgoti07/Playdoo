import { AdminDashboardStats } from "@/components/admin/dashboard/AdminDashboardStats";
import { AdminDashboardCharts } from "@/components/admin/dashboard/AdminDashboardCharts";
import { RecentActivity } from "@/components/admin/dashboard/RecentActivity";
import { QuickActions } from "@/components/admin/dashboard/QuickActions";

export default function AdminDashboard() {
  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-2">
          Overview of your sports facility booking platform
        </p>
      </div>

      {/* Stats Cards */}
      <AdminDashboardStats />

      {/* Charts Section */}
      <AdminDashboardCharts />

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <RecentActivity />
        <QuickActions />
      </div>
    </div>
  );
}
