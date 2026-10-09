"use client";

import { RequireAdmin } from "@/components/route-guards";
import { AdminSidebar } from "./admin-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAdmin>
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col md:flex-row">
        <AdminSidebar />
        <div className="min-w-0 flex-1 p-4 sm:p-8">{children}</div>
      </div>
    </RequireAdmin>
  );
}
