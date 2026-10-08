"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/settings";
import { Section, SectionHeading } from "@/components/section";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/route-guards";
import type { Course } from "@/lib/types/database";

type ModuleWithLessons = {
  id: string;
  title: string;
  description: string;
  lessons: { id: string; title: string; is_preview: boolean; published: boolean }[];
};

export function CourseClient() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);

  useEffect(() => {
    async function load() {
      const { data: courseRow } = await supabase
        .from("courses")
        .select("*")
        .eq("slug", "superchad")
        .eq("published", true)
        .maybeSingle();
      setCourse(courseRow ?? null);

      if (courseRow) {
        const { data } = await supabase
          .from("modules")
          .select("id, title, description, lessons(id, title, is_preview, published)")
          .eq("course_id", courseRow.id)
          .eq("published", true)
          .order("sort_order");
        setModules((data as unknown as ModuleWithLessons[]) ?? []);
      }
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Spinner />;

  const price = course?.price ?? 750;
  const currency = course?.currency ?? "PKR";

  return (
    <>
      <Section className="pt-16 sm:pt-20">
        <SectionHeading
          title={course?.title ?? "SuperChad"}
          description={
            course?.description ??
            "A structured, practical course on grooming, skincare, hairstyle, clothing, fitness and posture, built around consistent daily habits and honest presentation."
          }
        />
        <div className="mt-8">
          <ButtonLink href="/enroll/" size="lg">
            Enroll Now — {formatPrice(price, currency)}
          </ButtonLink>
        </div>
      </Section>

      <Section className="border-t border-base-800/80">
        <h2 className="font-display text-2xl text-ink-100">Curriculum</h2>
        <div className="mt-8 space-y-4">
          {modules.map((m, i) => (
            <Card key={m.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-ink-700">Module {String(i + 1).padStart(2, "0")}</p>
                  <h3 className="mt-1 font-display text-lg text-ink-100">{m.title}</h3>
                  <p className="mt-1 text-sm text-ink-500">{m.description}</p>
                </div>
              </div>
              {m.lessons?.filter((l) => l.published).length > 0 && (
                <ul className="mt-4 space-y-2 border-t border-base-800 pt-4">
                  {m.lessons
                    .filter((l) => l.published)
                    .map((l) => (
                      <li key={l.id} className="flex items-center justify-between text-sm">
                        <span className="text-ink-300">{l.title}</span>
                        {l.is_preview && <Badge status="published">Free preview</Badge>}
                      </li>
                    ))}
                </ul>
              )}
            </Card>
          ))}
          {modules.length === 0 && (
            <p className="text-sm text-ink-600">Curriculum is being finalized — check back soon.</p>
          )}
        </div>
      </Section>

      <Section className="border-t border-base-800/80 text-center">
        <h2 className="font-display text-2xl text-ink-100">Ready to start?</h2>
        <div className="mt-6">
          <ButtonLink href="/enroll/">Enroll Now — {formatPrice(price, currency)}</ButtonLink>
        </div>
      </Section>
    </>
  );
}
