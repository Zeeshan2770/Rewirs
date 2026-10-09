"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export function AuthNavActions({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  const { userId, profile, loading } = useAuth();

  if (loading) {
    return <div className="h-9 w-20 animate-pulse rounded-full bg-base-800" />;
  }

  if (userId) {
    const href = profile?.role === "admin" ? "/admin" : "/dashboard";
    return (
      <Link
        href={href}
        className={
          variant === "mobile"
            ? "rounded-full bg-accent px-4 py-2.5 text-center text-sm font-medium text-base-950"
            : "rounded-full bg-accent px-4 py-2 text-sm font-medium text-base-950 transition-colors hover:bg-accent-soft"
        }
      >
        Dashboard
      </Link>
    );
  }

  const linkClass =
    variant === "mobile"
      ? "rounded-full border border-base-700 px-4 py-2.5 text-center text-sm text-ink-100"
      : "rounded-full border border-base-700 px-4 py-2 text-sm text-ink-100 transition-colors hover:border-accent/50";
  const primaryClass =
    variant === "mobile"
      ? "rounded-full bg-accent px-4 py-2.5 text-center text-sm font-medium text-base-950"
      : "rounded-full bg-accent px-4 py-2 text-sm font-medium text-base-950 transition-colors hover:bg-accent-soft";

  return (
    <>
      <Link href="/login" className={linkClass}>
        Login
      </Link>
      <Link href="/enroll" className={primaryClass}>
        Enroll Now
      </Link>
    </>
  );
}
