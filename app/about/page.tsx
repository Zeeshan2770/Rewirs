import type { Metadata } from "next";
import { getSiteSettings } from "@/lib/settings";
import { Section, SectionHeading } from "@/components/section";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "About",
  description: "About Rayyan Naeem and the Rewirs course platform.",
};

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <>
      <Section className="pt-16 sm:pt-20">
        <SectionHeading
          title={`About ${settings.creator_name}`}
          description={`${settings.site_name} was built to turn scattered grooming and presentation advice into one structured, honest course.`}
        />
      </Section>

      <Section className="border-t border-base-800/80">
        <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:items-start">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-accent/30 font-display text-3xl text-accent">
            {settings.creator_name.split(" ").map((w) => w[0]).join("")}
          </div>
          <div className="max-w-2xl space-y-4 text-sm leading-7 text-ink-400">
            <p>
              {settings.creator_name} shares practical grooming, style and presentation content
              with a growing audience on YouTube and Instagram. {settings.site_name} is where that
              content becomes a structured course: nine modules you work through in order, each
              ending in a short checklist you can act on the same day.
            </p>
            <p>
              The course does not promise that appearance determines your worth, popularity or
              relationships, and it does not give medical advice. It focuses on what's actually
              useful — consistent grooming, skincare and fitness habits, a wardrobe you understand,
              posture that reflects confidence, and the kind of presentation that comes from
              showing up prepared, not from chasing an ideal.
            </p>
          </div>
        </div>
      </Section>

      <Section className="border-t border-base-800/80">
        <Card className="bg-base-900">
          <h2 className="font-display text-xl text-ink-100">Where to follow along</h2>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <a href={settings.youtube_url} target="_blank" rel="noreferrer" className="text-accent hover:text-accent-soft">
              YouTube — {settings.youtube_url.replace("https://www.", "")}
            </a>
            <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="text-accent hover:text-accent-soft">
              Instagram — {settings.instagram_url.replace("https://www.", "")}
            </a>
          </div>
        </Card>
      </Section>
    </>
  );
}
