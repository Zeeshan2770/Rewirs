"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Label, Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/route-guards";
import type { SiteSettings } from "@/lib/types/database";

export default function AdminSettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState<SiteSettings | null>(null);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message?: string }>({ type: "idle" });

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("*")
      .eq("id", true)
      .single()
      .then(({ data }) => {
        setValues(data ?? null);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values) return;
    if (!values.site_name || !values.contact_email) {
      setStatus({ type: "error", message: "Site name and contact email are required." });
      return;
    }
    if (values.course_price < 0) {
      setStatus({ type: "error", message: "Price cannot be negative." });
      return;
    }

    setPending(true);
    // This table has exactly one row (id = true). RLS's
    // site_settings_update_admin_only policy is what actually authorizes
    // this write.
    const { error } = await supabase
      .from("site_settings")
      .update({
        site_name: values.site_name,
        site_description: values.site_description,
        creator_name: values.creator_name,
        contact_email: values.contact_email,
        instagram_url: values.instagram_url,
        youtube_url: values.youtube_url,
        course_price: values.course_price,
        currency: values.currency,
        payment_instructions: values.payment_instructions,
      })
      .eq("id", true);
    setPending(false);

    if (error) {
      setStatus({ type: "error", message: "Couldn't save settings." });
      return;
    }
    setStatus({ type: "success", message: "Settings saved. Marketing pages (home, footer, etc.) are static and will pick this up on the next deploy." });
  }

  if (loading) return <Spinner />;
  if (!values) return <p className="text-sm text-ink-600">Couldn&apos;t load settings.</p>;

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setValues((v) => (v ? { ...v, [key]: value } : v));
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-100">Site settings</h1>
      <p className="mt-1 text-sm text-ink-600">
        Dynamic pages (enroll, admin) read these live. Static marketing pages (home, footer) bake
        these in at build time and need a rebuild + redeploy to reflect changes.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 max-w-2xl space-y-5">
        {status.type !== "idle" && (
          <Alert variant={status.type === "success" ? "success" : "error"}>{status.message}</Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="site_name">Site name</Label>
            <Input id="site_name" required value={values.site_name} onChange={(e) => set("site_name", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="creator_name">Creator name</Label>
            <Input id="creator_name" required value={values.creator_name} onChange={(e) => set("creator_name", e.target.value)} />
          </div>
        </div>

        <div>
          <Label htmlFor="site_description">Site description</Label>
          <Textarea id="site_description" rows={2} value={values.site_description} onChange={(e) => set("site_description", e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="contact_email">Contact email</Label>
            <Input id="contact_email" type="email" required value={values.contact_email} onChange={(e) => set("contact_email", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="instagram_url">Instagram URL</Label>
            <Input id="instagram_url" value={values.instagram_url} onChange={(e) => set("instagram_url", e.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="youtube_url">YouTube URL</Label>
            <Input id="youtube_url" value={values.youtube_url} onChange={(e) => set("youtube_url", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="course_price">Course price</Label>
              <Input id="course_price" type="number" step="0.01" required value={values.course_price} onChange={(e) => set("course_price", Number(e.target.value))} />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" required value={values.currency} onChange={(e) => set("currency", e.target.value)} />
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="payment_instructions">Payment instructions</Label>
          <Textarea id="payment_instructions" rows={5} value={values.payment_instructions} onChange={(e) => set("payment_instructions", e.target.value)} />
          <p className="mt-1.5 text-xs text-ink-700">
            Shown live on the Enroll page (that page fetches settings client-side). Include account
            numbers/handles for JazzCash, Easypaisa, bank transfer, etc.
          </p>
        </div>

        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save settings"}</Button>
      </form>
    </div>
  );
}
