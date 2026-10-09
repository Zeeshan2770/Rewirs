"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function Spinner() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-base-700 border-t-accent" />
    </div>
  );
}

/**
 * Gates a page behind "is signed in". This is a UX convenience only - it
 * redirects the browser so signed-out visitors don't see a flash of a page
 * with no data. It is NOT the security boundary: every query these pages
 * make is still enforced by Postgres Row Level Security regardless of
 * whether this check runs, so there is no way to bypass it by disabling
 * JavaScript or calling Supabase directly.
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { userId, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !userId) router.replace("/login/");
  }, [loading, userId, router]);

  if (loading || !userId) return <Spinner />;
  if (profile?.suspended) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="text-ink-100">Your account access has been suspended.</p>
        <p className="mt-2 text-sm text-ink-500">Contact support if you believe this is a mistake.</p>
      </div>
    );
  }

  return <>{children}</>;
}

/** Same idea as RequireAuth, but also checks role === 'admin'. */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { userId, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!userId) router.replace("/login/");
    else if (profile && profile.role !== "admin") router.replace("/");
  }, [loading, userId, profile, router]);

  if (loading || !userId || !profile || profile.role !== "admin") return <Spinner />;

  return <>{children}</>;
}

export { Spinner };
