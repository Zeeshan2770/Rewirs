import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/section";
import { getSiteSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Privacy" };

export default async function PrivacyPage() {
  const settings = await getSiteSettings();

  return (
    <Section className="pt-16 sm:pt-20">
      <SectionHeading title="Privacy policy" />
      <div className="prose-lesson mt-8">
        <h2>1. What we collect</h2>
        <p>
          When you create an account we store your name and email. When you submit an enrollment we
          store your name, email, phone/WhatsApp number, payment method, transaction reference,
          payment date, an optional payment proof image, and any message you include. We never
          request card numbers, CVVs, OTPs or banking passwords, and we never ask for your account
          password outside of the sign-in form.
        </p>

        <h2>2. How we use it</h2>
        <p>
          We use this information solely to verify your payment, grant course access, track your
          lesson progress, and respond to support requests. We do not sell your data.
        </p>

        <h2>3. Storage and security</h2>
        <p>
          Data is stored in Supabase (PostgreSQL) with Row Level Security enabled, so only you and
          our administrators can access your enrollment and progress records. Payment proof images
          are stored in a private storage bucket that is never publicly accessible.
        </p>

        <h2>4. Your rights</h2>
        <p>
          You may request access to, correction of, or deletion of your personal data at any time by
          emailing {settings.contact_email}.
        </p>

        <h2>5. Cookies</h2>
        <p>We use essential cookies to keep you signed in. We do not use third-party advertising trackers.</p>

        <h2>6. Contact</h2>
        <p>Questions about this policy can be sent to {settings.contact_email}.</p>
      </div>
    </Section>
  );
}
