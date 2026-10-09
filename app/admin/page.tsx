"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/route-guards";
import { formatDate } from "@/lib/utils";

type Recent = { id: string; full_name: string; email: string; status: string; created_at: string };

export default function AdminOverviewPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ students: 0, pending: 0, approved: 0, courses: 0, modules: 0, lessons: 0 });
  const [recent, setRecent] = useState<Recent[]>([]);

  useEffect(() => {
    async function load() {
      const [students, pending, approved, courses, modules, lessons, recentRows] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("enrollments").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("enrollments").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("courses").select("*", { count: "exact", head: true }),
        supabase.from("modules").select("*", { count: "exact", head: true }),
        supabase.from("lessons").select("*", { count: "exact", head: true }),
        supabase
          .from("enrollments")
          .select("id, full_name, email, status, created_at")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      setStats({
        students: students.count ?? 0,
        pending: pending.count ?? 0,
        approved: approved.count ?? 0,
        courses: courses.count ?? 0,
        modules: modules.count ?? 0,
        lessons: lessons.count ?? 0,
      });
      setRecent((recentRows.data as unknown as Recent[]) ?? []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Spinner />;

  const statList = [
    { label: "Students", value: stats.students },
    { label: "Pending enrollments", value: stats.pending },
    { label: "Approved enrollments", value: stats.approved },
    { label: "Courses", value: stats.courses },
    { label: "Modules", value: stats.modules },
    { label: "Lessons", value: stats.lessons },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-100">Overview</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {statList.map((s) => (
          <Card key={s.label} className="bg-base-900 p-4">
            <p className="text-2xl font-display text-ink-100">{s.value}</p>
            <p className="mt-1 text-xs text-ink-600">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-lg text-ink-100">Recent enrollment requests</h2>
        <Link href="/admin/enrollments/" className="text-sm text-accent hover:text-accent-soft">
          View all →
        </Link>
      </div>

      <Card className="mt-4 divide-y divide-base-800 p-0">
        {recent.map((e) => (
          <div key={e.id} className="flex items-center justify-between px-5 py-3">
            <div>
              <p className="text-sm text-ink-100">{e.full_name}</p>
              <p className="text-xs text-ink-600">{e.email} · {formatDate(e.created_at)}</p>
            </div>
            <Badge status={e.status}>{e.status}</Badge>
          </div>
        ))}
        {recent.length === 0 && <p className="px-5 py-6 text-sm text-ink-600">No enrollment requests yet.</p>}
      </Card>
    </div>
  );
}
