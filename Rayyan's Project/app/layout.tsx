import type { Metadata } from "next";
import { Manrope, Fraunces } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { getSiteSettings } from "@/lib/settings";
import { AuthProvider } from "@/lib/auth-context";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${settings.site_name} — SuperChad Course`,
      template: `%s — ${settings.site_name}`,
    },
    description: settings.site_description,
    openGraph: {
      title: `${settings.site_name} — SuperChad Course`,
      description: settings.site_description,
      siteName: settings.site_name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${settings.site_name} — SuperChad Course`,
      description: settings.site_description,
    },
    icons: {
      icon: "/icon.svg",
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${fraunces.variable}`}>
      <body className="flex min-h-screen flex-col">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
