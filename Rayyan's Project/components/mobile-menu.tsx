"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AuthNavActions } from "@/components/auth-nav-actions";

export function MobileMenu({ links }: { links: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-base-700 text-ink-100"
      >
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true">
          {open ? (
            <path d="M1 1L15 11M15 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          ) : (
            <path d="M0 1H16M0 6H16M0 11H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          )}
        </svg>
      </button>

      <div
        className={cn(
          "fixed inset-x-0 top-16 z-40 border-b border-base-700 bg-base-950 px-6 pb-6 pt-2 transition-[max-height,opacity] duration-200 overflow-hidden",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        )}
      >
        <nav className="flex flex-col gap-1 py-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-2.5 text-sm text-ink-300 hover:bg-base-800 hover:text-ink-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-2 flex flex-col gap-2 border-t border-base-800 pt-4">
          <AuthNavActions variant="mobile" />
        </div>
      </div>
    </div>
  );
}
