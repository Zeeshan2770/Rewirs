"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/settings";
import { Section, SectionHeading } from "@/components/section";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import type { Course, CourseModule, Faq, SiteSettings } from "@/lib/types/database";

const LEARN_POINTS = [
  { title: "Grooming that sticks", copy: "Daily and weekly habits that make the most visible difference, without a complicated product shelf." },
  { title: "Skin you understand", copy: "A simple routine sized for a beginner, built around consistency instead of trends." },
  { title: "Hair that suits you", copy: "How to choose and maintain a style that works with your face shape and routine." },
  { title: "A wardrobe that works", copy: "A small, versatile set of clothing choices instead of an overwhelming shopping list." },
  { title: "Fitness as a habit", copy: "General, responsible guidance on movement, sleep and nutrition basics — never a fad." },
  { title: "Posture and presence", copy: "How you stand, sit and move changes how put-together you come across." },
];

const WHO_FOR = [
  "You want a structured routine instead of scattered advice from random videos.",
  "You're ready to build habits over a few months, not chase overnight fixes.",
  "You want practical, checklist-driven lessons you can act on the same day.",
  "You care about presenting yourself well and showing up with confidence.",
];

const FALLBACK_MODULES: Pick<CourseModule, "id" | "slug" | "title" | "description">[] = [
  { id: "1", slug: "foundations", title: "Foundations", description: "Why consistency beats intensity." },
  { id: "2", slug: "grooming", title: "Grooming", description: "Daily and weekly grooming habits." },
  { id: "3", slug: "skincare", title: "Skincare", description: "A simple, sustainable routine." },
  { id: "4", slug: "hair-hairstyle", title: "Hair & Hairstyle", description: "Choosing and maintaining your style." },
  { id: "5", slug: "clothing-style", title: "Clothing & Style", description: "A small, versatile wardrobe." },
  { id: "6", slug: "fitness-healthy-habits", title: "Fitness & Healthy Habits", description: "General, responsible guidance." },
  { id: "7", slug: "posture-presentation", title: "Posture & Presentation", description: "How you carry yourself." },
  { id: "8", slug: "confidence", title: "Confidence", description: "Habits that build genuine confidence." },
  { id: "9", slug: "the-complete-routine", title: "The Complete Routine", description: "Everything, put together." },
];

const FALLBACK_SETTINGS: SiteSettings = {
  id: true,
  site_name: "Rewirs",
  site_description: "A structured course on grooming, style and presentation.",
  creator_name: "Rayyan Naeem",
  contact_email: "chapathan001@gmail.com",
  instagram_url: "https://www.instagram.com/golden_rayan10/",
  youtube_url: "https://www.youtube.com/@Rewirs_yt",
  course_price: 750,
  currency: "PKR",
  payment_instructions: "",
  updated_at: new Date().toISOString(),
};

// This whole page fetches live from Supabase on mount rather than baking
// data in at build time, so publishing a new module/lesson/FAQ from the
// admin panel shows up here immediately - no rebuild or redeploy needed.
// Sensible fallback content renders instantly so the page is never blank
// while that fetch is in flight.
export default function HomePage() {
  const supabase = createClient();
  const [settings, setSettings] = useState<SiteSettings>(FALLBACK_SETTINGS);
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [faqs, setFaqs] = useState<Faq[]>([]);

  useEffect(() => {
    async function load() {
      const [{ data: settingsRow }, { data: courseRow }] = await Promise.all([
        supabase.from("site_settings").select("*").eq("id", true).single(),
        supabase.from("courses").select("*").eq("slug", "superchad").eq("published", true).maybeSingle(),
      ]);

      if (settingsRow) setSettings(settingsRow as unknown as SiteSettings);
      setCourse(courseRow ?? null);

      if (courseRow) {
        const { data: moduleRows } = await supabase
          .from("modules")
          .select("*")
          .eq("course_id", courseRow.id)
          .eq("published", true)
          .order("sort_order");
        setModules(moduleRows ?? []);
      }

      const { data: faqRows } = await supabase
        .from("faqs")
        .select("*")
        .eq("published", true)
        .order("sort_order")
        .limit(5);
      setFaqs(faqRows ?? []);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const price = course?.price ?? settings.course_price;
  const currency = course?.currency ?? settings.currency;
  const displayModules = modules.length ? modules : FALLBACK_MODULES;

  return (
    <>
      {/* 1. Hero */}
      <Section className="pb-10 pt-16 sm:pt-24">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <h1 className="font-display text-[2.6rem] leading-[1.08] text-ink-100 sm:text-[3.4rem]">
              Build a Better Version of Your Presentation
            </h1>
            <p className="mt-6 max-w-lg text-lg text-ink-500">
              {settings.site_name} teaches a structured approach to grooming, skincare, hairstyle,
              clothing, fitness, posture and personal presentation — nine modules, built around
              habits you can actually keep.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <ButtonLink href="/enroll" size="lg">
                Enroll Now — {formatPrice(price, currency)}
              </ButtonLink>
              <ButtonLink href="/course" variant="secondary" size="lg">
                Explore Course
              </ButtonLink>
            </div>
          </div>

          <Card className="bg-base-900">
            <p className="text-sm text-ink-500">The course</p>
            <p className="mt-2 font-display text-2xl text-ink-100">SuperChad</p>
            <p className="mt-3 text-sm leading-6 text-ink-500">
              {course?.short_description ??
                "A structured routine for grooming, style, fitness and confident presentation."}
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-base-800 pt-6 text-sm">
              <div>
                <dt className="text-ink-700">Modules</dt>
                <dd className="mt-1 text-ink-100">{displayModules.length}</dd>
              </div>
              <div>
                <dt className="text-ink-700">Price</dt>
                <dd className="mt-1 text-ink-100">{formatPrice(price, currency)}</dd>
              </div>
              <div>
                <dt className="text-ink-700">Format</dt>
                <dd className="mt-1 text-ink-100">Self-paced video + text</dd>
              </div>
              <div>
                <dt className="text-ink-700">Access</dt>
                <dd className="mt-1 text-ink-100">Lifetime</dd>
              </div>
            </dl>
          </Card>
        </div>
      </Section>

      {/* 2. What You'll Learn */}
      <Section className="border-t border-base-800/80">
        <SectionHeading
          title="What you'll learn"
          description="Six practical areas, each broken into short lessons with a checklist you can act on immediately."
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {LEARN_POINTS.map((point) => (
            <Card key={point.title}>
              <h3 className="font-display text-lg text-ink-100">{point.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-500">{point.copy}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* 3. Course Overview */}
      <Section className="border-t border-base-800/80">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <SectionHeading
            title="One course, one clear routine"
            description="SuperChad is not a library of random tips. It's a sequence — foundations first, then each area of presentation, ending with a complete routine that ties everything together."
          />
          <Card className="bg-base-900">
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3">
                <span className="mt-0.5 text-accent">—</span>
                <span className="text-ink-300">No unrealistic promises. Appearance doesn't determine your worth — this course is about habits and presentation.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 text-accent">—</span>
                <span className="text-ink-300">No medical claims. General guidance only; see a professional for medical or dermatological concerns.</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 text-accent">—</span>
                <span className="text-ink-300">Practical checklists at the end of every lesson, so you always know the next action.</span>
              </li>
            </ul>
          </Card>
        </div>
      </Section>

      {/* 4. Curriculum */}
      <Section className="border-t border-base-800/80" id="curriculum">
        <SectionHeading title="Curriculum" description={`${displayModules.length} modules, in order.`} />
        <ol className="mt-10 divide-y divide-base-800 border-y border-base-800">
          {displayModules.map((m, i) => (
            <li key={m.id ?? m.slug} className="flex items-center gap-6 py-5">
              <span className="w-8 shrink-0 font-display text-lg text-ink-700">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-ink-100">{m.title}</p>
                <p className="mt-1 text-sm text-ink-600">{m.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* 5. Who This Course Is For */}
      <Section className="border-t border-base-800/80">
        <SectionHeading title="Who this course is for" />
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {WHO_FOR.map((item) => (
            <Card key={item} className="bg-base-900">
              <p className="text-sm leading-6 text-ink-300">{item}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* 6. Creator */}
      <Section className="border-t border-base-800/80">
        <Card className="bg-base-900 sm:p-10">
          <div className="grid gap-8 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-accent/30 font-display text-2xl text-accent">
              {settings.creator_name
                .split(" ")
                .map((w) => w[0])
                .join("")}
            </div>
            <div>
              <p className="text-sm text-ink-600">Created by</p>
              <p className="font-display text-2xl text-ink-100">{settings.creator_name}</p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-ink-500">
                {settings.creator_name} shares grooming, style and presentation content and built{" "}
                {settings.site_name} to turn that into a structured, practical course.
              </p>
              <div className="mt-4 flex gap-4 text-sm">
                <a href={settings.youtube_url} target="_blank" rel="noreferrer" className="text-accent hover:text-accent-soft">
                  YouTube
                </a>
                <a href={settings.instagram_url} target="_blank" rel="noreferrer" className="text-accent hover:text-accent-soft">
                  Instagram
                </a>
              </div>
            </div>
          </div>
        </Card>
      </Section>

      {/* 7. Pricing */}
      <Section className="border-t border-base-800/80" id="pricing">
        <SectionHeading title="Pricing" />
        <Card className="mt-10 max-w-md bg-base-900">
          <p className="font-display text-4xl text-ink-100">{formatPrice(price, currency)}</p>
          <p className="mt-1 text-sm text-ink-600">One-time payment · lifetime access</p>
          <ul className="mt-6 space-y-2 text-sm text-ink-300">
            <li>All {displayModules.length} modules and every lesson</li>
            <li>Progress tracking on your dashboard</li>
            <li>Practical checklists for every lesson</li>
          </ul>
          <ButtonLink href="/enroll" className="mt-6 w-full">
            Enroll Now — {formatPrice(price, currency)}
          </ButtonLink>
          <p className="mt-3 text-xs text-ink-700">
            Payment is verified manually. See the Enroll page for instructions.
          </p>
        </Card>
      </Section>

      {/* 8. FAQ */}
      <Section className="border-t border-base-800/80" id="faq">
        <SectionHeading title="Frequently asked questions" />
        <div className="mt-10 divide-y divide-base-800 border-y border-base-800">
          {faqs.map((faq) => (
            <details key={faq.id} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-ink-100">
                {faq.question}
                <span className="ml-4 text-ink-600 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">{faq.answer}</p>
            </details>
          ))}
          {faqs.length === 0 && <p className="py-6 text-sm text-ink-600">Loading questions…</p>}
        </div>
        <div className="mt-6">
          <Link href="/faq/" className="text-sm text-accent hover:text-accent-soft">
            View all questions →
          </Link>
        </div>
      </Section>

      {/* 9. Final CTA */}
      <Section className="border-t border-base-800/80 text-center">
        <h2 className="mx-auto max-w-lg font-display text-3xl text-ink-100 sm:text-4xl">
          Start building your routine today
        </h2>
        <p className="mx-auto mt-3 max-w-md text-ink-500">
          Join {settings.site_name} for {formatPrice(price, currency)} and get structured access to every module.
        </p>
        <div className="mt-8">
          <ButtonLink href="/enroll" size="lg">
            Enroll Now — {formatPrice(price, currency)}
          </ButtonLink>
        </div>
      </Section>
    </>
  );
}
