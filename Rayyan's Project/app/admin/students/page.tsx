"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/route-guards";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/lib/types/database";

export default function AdminStudentsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <StudentsContent />
    </Suspense>
  );
}

type StudentRow = Profile & {
  enrollments: { status: string; course_id: string; courses: { title: string } | null }[];
};

function StudentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") ?? "";
  const { userId: adminId } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [search, setSearch] = useState(q);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      let query = supabase
        .from("profiles")
        .select("*, enrollments(status, course_id, courses(title))")
        .eq("role", "student")
        .order("created_at", { ascending: false });
      if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
      const { data } = await query;
      if (!cancelled) {
        setStudents((data as unknown as StudentRow[]) ?? []);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(search ? `/admin/students/?q=${encodeURIComponent(search)}` : "/admin/students/");
  }

  async function toggleSuspend(student: StudentRow) {
    if (student.id === adminId) return;
    const next = !student.suspended;
    setStudents((rows) => rows.map((s) => (s.id === student.id ? { ...s, suspended: next } : s)));
    // RLS's profiles_update_own_or_admin policy plus guard_profile_update
    // are what actually authorize an admin changing another user's
    // `suspended` flag.
    const { error } = await supabase.from("profiles").update({ suspended: next }).eq("id", student.id);
    if (error) {
      setStudents((rows) => rows.map((s) => (s.id === student.id ? { ...s, suspended: !next } : s)));
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink-100">Students</h1>
        <form onSubmit={handleSearch} className="w-full max-w-xs sm:w-auto">
          <Input placeholder="Search name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
        </form>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="mt-6 space-y-3">
          {students.map((s) => {
            const activeEnrollment = s.enrollments?.find((e) => e.status === "approved") ?? s.enrollments?.[0];
            return (
              <Card key={s.id} className="bg-base-900">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-ink-100">{s.full_name || "(no name)"}</p>
                      {s.suspended && <Badge status="rejected">Suspended</Badge>}
                    </div>
                    <p className="text-sm text-ink-600">{s.email}</p>
                    <p className="mt-1 text-xs text-ink-700">Joined {formatDate(s.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {activeEnrollment ? (
                      <div className="text-right text-sm">
                        <p className="text-ink-400">{activeEnrollment.courses?.title}</p>
                        <Badge status={activeEnrollment.status}>{activeEnrollment.status}</Badge>
                      </div>
                    ) : (
                      <p className="text-sm text-ink-700">No enrollment</p>
                    )}
                    <Button
                      size="sm"
                      variant={s.suspended ? "secondary" : "danger"}
                      onClick={() => toggleSuspend(s)}
                    >
                      {s.suspended ? "Restore access" : "Suspend access"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
          {students.length === 0 && <p className="text-sm text-ink-600">No students found.</p>}
        </div>
      )}
    </div>
  );
}
