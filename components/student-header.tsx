"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";
import { useAuth } from "@/lib/auth-context";

const TABS = [
  { href: "/dashboard/", label: "Dashboard" },
  { href: "/profile/", label: "Profile" },
];

export function StudentHeader() {
  const { profile, email } = useAuth();
  const pathname = usePathname();

  return (
    <div className="border-b border-base-800/80 bg-base-900/40">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div>
          <p className="text-sm text-ink-600">Signed in as</p>
          <p className="text-ink-100">{profile?.full_name || email}</p>
        </div>
        <div className="flex items-center gap-1">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "rounded-full px-4 py-2 text-sm transition-colors",
                pathname?.startsWith(tab.href.replace(/\/$/, "")) ? "bg-accent text-base-950" : "text-ink-300 hover:bg-base-800"
              )}
            >
              {tab.label}
            </Link>
          ))}
          <LogoutButton className="ml-2" />
        </div>
      </div>
    </div>
  );
}
