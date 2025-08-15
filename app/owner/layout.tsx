import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { OwnerSidebar } from "@/components/owner/OwnerSidebar";
import { OwnerHeader } from "@/components/owner/OwnerHeader";

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Check if user is authenticated
  if (!session || !session.user) {
    redirect("/login");
  }

  // Check if user has facility_owner role
  if (session.user.role !== "facility_owner") {
    // Redirect based on user role
    if (session.user.role === "admin") {
      redirect("/admin");
    } else {
      redirect("/");
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <OwnerSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <OwnerHeader user={session.user} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
