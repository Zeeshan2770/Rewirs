import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";

export async function Footer() {
  const settings = await getSiteSettings();

  return (
    <footer className="border-t border-base-800/80">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <p className="font-display text-lg text-ink-100">{settings.site_name}</p>
            <p className="mt-2 max-w-xs text-sm text-ink-500">{settings.site_description}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-ink-100">Course</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li><Link href="/course" className="hover:text-ink-200">Curriculum</Link></li>
              <li><Link href="/enroll" className="hover:text-ink-200">Enroll</Link></li>
              <li><Link href="/faq" className="hover:text-ink-200">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-ink-100">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li><Link href="/about" className="hover:text-ink-200">About {settings.creator_name}</Link></li>
              <li><Link href="/contact" className="hover:text-ink-200">Contact</Link></li>
              <li><Link href="/terms" className="hover:text-ink-200">Terms</Link></li>
              <li><Link href="/privacy" className="hover:text-ink-200">Privacy</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-ink-100">Connect</p>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li>
                <a href={settings.youtube_url} target="_blank" rel="noreferrer" className="hover:text-ink-200">
                  YouTube
                </a>
              </li>
              <li>
                <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="hover:text-ink-200">
                  Instagram
                </a>
              </li>
              <li>
                <a href={`mailto:${settings.contact_email}`} className="hover:text-ink-200">
                  {settings.contact_email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-base-800 pt-6 text-xs text-ink-700 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {settings.site_name}. All rights reserved.</p>
          <p>Built by {settings.creator_name}</p>
        </div>
      </div>
    </footer>
  );
}
