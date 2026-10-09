import Link from "next/link";
import { Logo } from "@/components/logo";
import { MobileMenu } from "@/components/mobile-menu";
import { AuthNavActions } from "@/components/auth-nav-actions";
import { getSiteSettings } from "@/lib/settings";

const NAV_LINKS = [
  { href: "/course", label: "Course" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

// Static shell (site name, nav links) is resolved at build time; the
// Login/Dashboard button is delegated to a client component since it
// depends on the visitor's own browser session.
export async function Navbar() {
  const settings = await getSiteSettings();

  return (
    <header className="sticky top-0 z-50 border-b border-base-800/80 bg-base-950/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo siteName={settings.site_name} />

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-ink-300 transition-colors hover:text-ink-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <AuthNavActions variant="desktop" />
        </div>

        <MobileMenu links={NAV_LINKS} />
      </div>
    </header>
  );
}
