"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { RequireAuth, Spinner } from "@/components/route-guards";
import { Section } from "@/components/section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CourseModule, Lesson } from "@/lib/types/database";

export default function ModulePage() {
  return (
    <RequireAuth>
      <Suspense fallback={<Spinner />}>
        <ModuleContent />
      </Suspense>
    </RequireAuth>
  );
}

function ModuleContent() {
  const searchParams = useSearchParams();
  const moduleSlug = searchParams.get("m");
  const router = useRouter();
  const { userId } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [courseModule, setCourseModule] = useState<CourseModule | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!userId || !moduleSlug) return;
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

      // This client-side check only decides whether to redirect for a
      // better UX. The `lessons_select_enrolled` RLS policy is the real
      // reason the query below returns nothing for an unenrolled user.
      const { data: enrollmentRow } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", course.id)
        .eq("status", "approved")
        .maybeSingle();

      if (!enrollmentRow) {
        setDenied(true);
        setLoading(false);
        return;
      }

      const { data: lessonRows } = await supabase
        .from("lessons")
        .select("*")
        .eq("module_id", mod.id)
        .eq("published", true)
        .order("sort_order");
      if (cancelled) return;
      setLessons(lessonRows ?? []);

      if (lessonRows && lessonRows.length > 0) {
        const { data: progress } = await supabase
          .from("lesson_progress")
          .select("lesson_id, completed")
          .eq("user_id", userId)
          .in("lesson_id", lessonRows.map((l) => l.id));
        if (!cancelled) {
          setCompletedIds(new Set((progress ?? []).filter((p) => p.completed).map((p) => p.lesson_id)));
        }
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, moduleSlug]);

  useEffect(() => {
    if (denied) router.replace("/dashboard/");
  }, [denied, router]);

  if (!moduleSlug || loading || denied) return <Spinner />;
  if (!courseModule) return <p className="p-10 text-center text-sm text-ink-600">Module not found.</p>;

  return (
    <Section>
      <p className="text-sm text-ink-600">
        <Link href="/dashboard/" className="hover:text-ink-300">Dashboard</Link> / {courseModule.title}
      </p>
      <h1 className="mt-2 font-display text-3xl text-ink-100">{courseModule.title}</h1>
      <p className="mt-2 max-w-xl text-ink-500">{courseModule.description}</p>

      <div className="mt-8 space-y-3">
        {lessons.map((lesson, i) => (
          <Link key={lesson.id} href={`/learn/lesson/?m=${moduleSlug}&l=${lesson.slug}`}>
            <Card className="transition-colors hover:border-accent/40">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="w-6 shrink-0 text-sm text-ink-700">{i + 1}</span>
                  <div>
                    <p className="text-ink-100">{lesson.title}</p>
                    <p className="mt-0.5 text-sm text-ink-600">{lesson.description}</p>
                  </div>
                </div>
                {completedIds.has(lesson.id) && <Badge status="approved">Done</Badge>}
              </div>
            </Card>
          </Link>
        ))}
        {lessons.length === 0 && <p className="text-sm text-ink-600">No lessons published in this module yet.</p>}
      </div>
    </Section>
  );
}
