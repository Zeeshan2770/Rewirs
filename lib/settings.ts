import { createPublicClient } from "@/lib/supabase/public";
import type { SiteSettings } from "@/lib/types/database";

const FALLBACK: SiteSettings = {
  id: true,
  site_name: "Rewirs",
  site_description: "A structured course on grooming, style and presentation.",
  creator_name: "Rayyan Naeem",
  contact_email: "chapathan001@gmail.com",
  instagram_url: "https://www.instagram.com/golden_rayan10/",
  youtube_url: "https://www.youtube.com/@Rewirs_yt",
  course_price: 750,
  currency: "PKR",
  payment_instructions:
    "Send payment via JazzCash / Easypaisa / Bank Transfer, then submit the enrollment form with your transaction reference.",
  updated_at: new Date().toISOString(),
};

/**
 * Build-time settings fetch for static Server Components (layout metadata,
 * navbar, footer, marketing pages). Baked into the exported HTML at
 * `next build` time - changing a value in /admin/settings after deploy
 * requires a rebuild + redeploy to show up on these static pages. Pages
 * that need live values (e.g. the enroll form) read site_settings directly
 * with the browser client instead.
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase.from("site_settings").select("*").eq("id", true).single();
    return data ?? FALLBACK;
  } catch {
    return FALLBACK;
  }
}

export function formatPrice(amount: number, currency: string) {
  return `${currency === "PKR" ? "Rs." : currency} ${amount.toLocaleString()}`;
}
