"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/logout-button";

const LINKS = [
  { href: "/admin/", label: "Overview" },
  { href: "/admin/enrollments/", label: "Enrollments" },
  { href: "/admin/students/", label: "Students" },
  { href: "/admin/courses/", label: "Courses" },
  { href: "/admin/modules/", label: "Modules" },
  { href: "/admin/lessons/", label: "Lessons" },
  { href: "/admin/faqs/", label: "FAQs" },
  { href: "/admin/media/", label: "Media" },
  { href: "/admin/messages/", label: "Messages" },
  { href: "/admin/settings/", label: "Settings" },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((link) => {
        const active = link.href === "/admin/" ? pathname === "/admin/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "rounded-lg px-3 py-2 text-sm transition-colors",
              active ? "bg-accent/10 text-accent" : "text-ink-400 hover:bg-base-800 hover:text-ink-100"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminSidebar() {
  const pathname = usePathname() ?? "/admin/";
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="hidden w-56 shrink-0 border-r border-base-800 p-4 md:block">
        <p className="px-3 pb-4 font-display text-lg text-ink-100">Admin</p>
        <NavLinks pathname={pathname} />
        <div className="mt-6 border-t border-base-800 pt-4">
          <LogoutButton />
        </div>
      </aside>

      <div className="flex items-center justify-between border-b border-base-800 px-4 py-3 md:hidden">
        <p className="font-display text-lg text-ink-100">Admin</p>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-base-700"
          aria-label="Toggle menu"
        >
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <path d="M0 1H16M0 6H16M0 11H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      {open && (
        <div className="border-b border-base-800 p-4 md:hidden">
          <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
          <div className="mt-4 border-t border-base-800 pt-4">
            <LogoutButton />
          </div>
        </div>
      )}
    </>
  );
}
