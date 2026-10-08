"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/settings";
import { RequireAuth, Spinner } from "@/components/route-guards";
import { Section } from "@/components/section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { StudentHeader } from "@/components/student-header";
import type { Course, CourseModule, Enrollment, Lesson } from "@/lib/types/database";

type ModuleWithLessons = CourseModule & { lessons: Pick<Lesson, "id" | "title" | "slug" | "sort_order" | "published">[] };

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}

function DashboardContent() {
  const { userId, profile } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      const { data: courseRow } = await supabase.from("courses").select("*").eq("slug", "superchad").maybeSingle();
      if (cancelled) return;
      setCourse(courseRow ?? null);
      if (!courseRow) {
        setLoading(false);
        return;
      }

      const { data: enrollmentRow } = await supabase
        .from("enrollments")
        .select("*")
        .eq("user_id", userId)
        .eq("course_id", courseRow.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      setEnrollment(enrollmentRow ?? null);

      const { data: moduleRows } = await supabase
        .from("modules")
        .select("*, lessons(id, title, slug, sort_order, published)")
        .eq("course_id", courseRow.id)
        .eq("published", true)
        .order("sort_order");
      if (cancelled) return;
      const modulesData = (moduleRows ?? []) as unknown as ModuleWithLessons[];
      setModules(modulesData);

      if (enrollmentRow?.status === "approved") {
        const lessonIds = modulesData.flatMap((m) => m.lessons.filter((l) => l.published).map((l) => l.id));
        if (lessonIds.length > 0) {
          const { data: progress } = await supabase
            .from("lesson_progress")
            .select("lesson_id, completed")
            .eq("user_id", userId)
            .in("lesson_id", lessonIds);
          if (!cancelled) {
            setCompletedIds(new Set((progress ?? []).filter((p) => p.completed).map((p) => p.lesson_id)));
          }
        }
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (loading) return <Spinner />;

  const hasAccess = enrollment?.status === "approved";
  const allLessons = modules.flatMap((m) => m.lessons.filter((l) => l.published));
  const totalLessons = allLessons.length;
  const progressPct = totalLessons > 0 ? Math.round((completedIds.size / totalLessons) * 100) : 0;

  const sortedModules = [...modules].sort((a, b) => a.sort_order - b.sort_order);
  let continueHref = "/course/";
  if (hasAccess) {
    let nextModule: ModuleWithLessons | null = null;
    let nextLesson: ModuleWithLessons["lessons"][number] | null = null;
    for (const m of sortedModules) {
      const lessons = m.lessons.filter((l) => l.published).sort((a, b) => a.sort_order - b.sort_order);
      const found = lessons.find((l) => !completedIds.has(l.id));
      if (found) {
        nextModule = m;
        nextLesson = found;
        break;
      }
    }
    if (nextModule && nextLesson) {
      continueHref = `/learn/lesson/?m=${nextModule.slug}&l=${nextLesson.slug}`;
    } else if (sortedModules[0]?.lessons?.[0]) {
      continueHref = `/learn/lesson/?m=${sortedModules[0].slug}&l=${sortedModules[0].lessons[0].slug}`;
    }
  }

  return (
    <>
      <StudentHeader />
      <Section>
        <h1 className="font-display text-3xl text-ink-100">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>

        {!course && (
          <Card className="mt-8 bg-base-900">
            <p className="text-ink-300">The course isn&apos;t available yet. Check back soon.</p>
          </Card>
        )}

        {course && !enrollment && (
          <Card className="mt-8 bg-base-900">
            <p className="text-ink-100">You haven&apos;t enrolled in {course.title} yet.</p>
            <p className="mt-1 text-sm text-ink-500">
              Enroll for {formatPrice(course.price, course.currency)} to get full access.
            </p>
            <ButtonLink href="/enroll/" className="mt-4">
              Enroll Now
            </ButtonLink>
          </Card>
        )}

        {course && enrollment && enrollment.status !== "approved" && (
          <Card className="mt-8 bg-base-900">
            <div className="flex items-center gap-3">
              <Badge status={enrollment.status}>{enrollment.status}</Badge>
              <p className="text-ink-100">{course.title}</p>
            </div>
            <p className="mt-3 text-sm text-ink-500">
              {enrollment.status === "pending" &&
                "Your enrollment request has been received and is pending payment verification. This usually takes 24-48 hours."}
              {enrollment.status === "rejected" &&
                "Your enrollment request was not approved. Contact us if you believe this is a mistake, or submit a new request."}
              {enrollment.status === "cancelled" && "You cancelled this enrollment request."}
            </p>
            {(enrollment.status === "rejected" || enrollment.status === "cancelled") && (
              <ButtonLink href="/enroll/" className="mt-4">
                Submit a new request
              </ButtonLink>
            )}
          </Card>
        )}

        {course && hasAccess && (
          <>
            <Card className="mt-8 bg-base-900">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-display text-xl text-ink-100">{course.title}</p>
                    <Badge status="approved">Enrolled</Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-500">
                    {completedIds.size} of {totalLessons} lessons completed
                  </p>
                </div>
                <ButtonLink href={continueHref}>Continue learning</ButtonLink>
              </div>
              <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-base-800">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progressPct}%` }} />
              </div>
              <p className="mt-2 text-xs text-ink-700">{progressPct}% complete</p>
            </Card>

            <div className="mt-8 space-y-4">
              {sortedModules.map((m, i) => {
                const lessons = m.lessons.filter((l) => l.published);
                return (
                  <Link key={m.id} href={`/learn/?m=${m.slug}`}>
                    <Card className="transition-colors hover:border-accent/40">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-ink-700">Module {String(i + 1).padStart(2, "0")}</p>
                          <p className="mt-1 text-ink-100">{m.title}</p>
                        </div>
                        <p className="text-sm text-ink-600">{lessons.length} lessons</p>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </Section>
    </>
  );
}
