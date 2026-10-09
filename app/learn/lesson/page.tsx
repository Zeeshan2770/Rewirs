"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { RequireAuth, Spinner } from "@/components/route-guards";
import { Section } from "@/components/section";
import { ButtonLink, Button } from "@/components/ui/button";
import { LessonVideo } from "@/components/lesson-video";
import type { CourseModule, Lesson } from "@/lib/types/database";

export default function LessonPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<Spinner />}>
        <LessonContent />
      </Suspense>
    </RequireAuth>
  );
}

function LessonContent() {
  const searchParams = useSearchParams();
  const moduleSlug = searchParams.get("m");
  const lessonSlug = searchParams.get("l");
  const router = useRouter();
  const { userId } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [courseModule, setCourseModule] = useState<CourseModule | null>(null);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [siblings, setSiblings] = useState<Pick<Lesson, "id" | "slug" | "sort_order">[]>([]);
  const [completed, setCompleted] = useState(false);
  const [denied, setDenied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId || !moduleSlug || !lessonSlug) return;
    let cancelled = false;

    async function load() {
      const { data: course } = await supabase.from("courses").select("id").eq("slug", "superchad").maybeSingle();
      if (!course || cancelled) return;

      const { data: mod } = await supabase
        .from("modules")
        .select("*")
        .eq("course_id", course.id)
        .eq("slug", moduleSlug)
        .eq("published", true)
        .maybeSingle();
      if (cancelled) return;
      if (!mod) {
        setDenied(true);
        setLoading(false);
        return;
      }
      setCourseModule(mod);

      // Real enforcement lives in the `lessons_select_enrolled` RLS policy:
      // a non-preview lesson row simply won't come back for an unenrolled
      // user no matter what this component does.
      const { data: lessonRow } = await supabase
        .from("lessons")
        .select("*")
        .eq("module_id", mod.id)
        .eq("slug", lessonSlug)
        .eq("published", true)
        .maybeSingle();

      if (cancelled) return;
      if (!lessonRow) {
        setDenied(true);
        setLoading(false);
        return;
      }
      setLesson(lessonRow);

      const { data: siblingRows } = await supabase
        .from("lessons")
        .select("id, slug, sort_order")
        .eq("module_id", mod.id)
        .eq("published", true)
        .order("sort_order");
      if (!cancelled) setSiblings(siblingRows ?? []);

      const { data: progressRow } = await supabase
        .from("lesson_progress")
        .select("completed")
        .eq("user_id", userId)
        .eq("lesson_id", lessonRow.id)
        .maybeSingle();
      if (!cancelled) setCompleted(!!progressRow?.completed);

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, moduleSlug, lessonSlug]);

  useEffect(() => {
    if (denied) router.replace("/dashboard/");
  }, [denied, router]);

  async function toggleComplete() {
    if (!lesson || !userId) return;
    const next = !completed;
    setCompleted(next);
    setSaving(true);
    // RLS + the guard_lesson_progress_write trigger enforce that this only
    // succeeds with an approved enrollment for this lesson's course.
    const { error } = await supabase
      .from("lesson_progress")
      .upsert({ user_id: userId, lesson_id: lesson.id, completed: next }, { onConflict: "user_id,lesson_id" });
    setSaving(false);
    if (error) setCompleted(!next);
  }

  if (!moduleSlug || !lessonSlug || loading || denied) return <Spinner />;
  if (!lesson || !courseModule) return <p className="p-10 text-center text-sm text-ink-600">Lesson not found.</p>;

  const idx = siblings.findIndex((l) => l.id === lesson.id);
  const prev = idx > 0 ? siblings[idx - 1] : null;
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null;

  return (
    <Section className="max-w-3xl">
      <p className="text-sm text-ink-600">
        <Link href="/dashboard/" className="hover:text-ink-300">Dashboard</Link> /{" "}
        <Link href={`/learn/?m=${moduleSlug}`} className="hover:text-ink-300">{courseModule.title}</Link>
      </p>
      <h1 className="mt-2 font-display text-3xl text-ink-100">{lesson.title}</h1>
      {lesson.description && <p className="mt-2 text-ink-500">{lesson.description}</p>}

      {lesson.video_url && (
        <div className="mt-6">
          <LessonVideo url={lesson.video_url} />
        </div>
      )}

      {lesson.content && (
        <div className="prose-lesson mt-8">
          {lesson.content.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      )}

      {lesson.key_takeaways?.length > 0 && (
        <div className="mt-8 rounded-2xl border border-base-700 bg-base-900 p-6">
          <h2 className="font-display text-lg text-ink-100">Key takeaways</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-300">
            {lesson.key_takeaways.map((point, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-accent">—</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {lesson.checklist?.length > 0 && (
        <div className="mt-6 rounded-2xl border border-base-700 bg-base-900 p-6">
          <h2 className="font-display text-lg text-ink-100">Practical checklist</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-300">
            {lesson.checklist.map((item, i) => (
              <li key={i} className="flex gap-2">
                <input type="checkbox" className="mt-1 accent-accent" readOnly />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10">
        <Button onClick={toggleComplete} disabled={saving} variant={completed ? "secondary" : "primary"}>
          {completed ? "✓ Lesson complete" : "Mark lesson complete"}
        </Button>
      </div>

      <div className="mt-10 flex items-center justify-between border-t border-base-800 pt-6">
        {prev ? (
          <ButtonLink href={`/learn/lesson/?m=${moduleSlug}&l=${prev.slug}`} variant="secondary">
            ← Previous
          </ButtonLink>
        ) : (
          <span />
        )}
        {next ? (
          <ButtonLink href={`/learn/lesson/?m=${moduleSlug}&l=${next.slug}`}>Next →</ButtonLink>
        ) : (
          <ButtonLink href="/dashboard/" variant="secondary">Back to dashboard</ButtonLink>
        )}
      </div>
    </Section>
  );
}
