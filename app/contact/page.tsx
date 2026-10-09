import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/section";
import { Card } from "@/components/ui/card";
import { getSiteSettings } from "@/lib/settings";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Rewirs team.",
};

export default async function ContactPage() {
  const settings = await getSiteSettings();

  return (
    <Section className="pt-16 sm:pt-20">
      <SectionHeading
        title="Contact us"
        description="Questions about the course or your enrollment? Send a message and we'll reply by email."
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <Card className="h-fit bg-base-900">
          <p className="text-sm text-ink-600">Email</p>
          <a href={`mailto:${settings.contact_email}`} className="mt-1 block text-ink-100 hover:text-accent">
            {settings.contact_email}
          </a>
          <p className="mt-6 text-sm text-ink-600">Social</p>
          <div className="mt-1 flex flex-col gap-1">
            <a href={settings.youtube_url} target="_blank" rel="noreferrer" className="text-ink-100 hover:text-accent">
              YouTube
            </a>
            <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="text-ink-100 hover:text-accent">
              Instagram
            </a>
          </div>
        </Card>

        <Card>
          <ContactForm />
        </Card>
      </div>
    </Section>
  );
}
