"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/route-guards";
import { formatDate, cn } from "@/lib/utils";
import type { Enrollment, EnrollmentStatus } from "@/lib/types/database";

const TABS = ["all", "pending", "approved", "rejected", "cancelled"] as const;

export default function AdminEnrollmentsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <EnrollmentsContent />
    </Suspense>
  );
}

type Row = Enrollment & { courses: { title: string } | null };

function EnrollmentsContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const activeTab = (TABS as readonly string[]).includes(status ?? "") ? (status as (typeof TABS)[number]) : "all";

  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<Row[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      let query = supabase.from("enrollments").select("*, courses(title)").order("created_at", { ascending: false });
      if (activeTab !== "all") query = query.eq("status", activeTab);
      const { data } = await query;
      if (!cancelled) {
        setEnrollments((data as unknown as Row[]) ?? []);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  function updateLocal(id: string, patch: Partial<Row>) {
    setEnrollments((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function review(id: string, decision: EnrollmentStatus, adminNote: string) {
    // RLS's enrollments_update_own_or_admin policy plus the
    // guard_enrollment_update trigger are what actually authorize this
    // write and stamp reviewed_by/reviewed_at - not anything client-side.
    const { error } = await supabase
      .from("enrollments")
      .update({ status: decision, admin_note: adminNote || null })
      .eq("id", id);
    if (!error) updateLocal(id, { status: decision, admin_note: adminNote || null });
    return !error;
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-100">Enrollments</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab}
            href={tab === "all" ? "/admin/enrollments/" : `/admin/enrollments/?status=${tab}`}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm capitalize",
              activeTab === tab ? "border-accent bg-accent/10 text-accent" : "border-base-700 text-ink-400"
            )}
          >
            {tab}
          </Link>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="mt-6 space-y-4">
          {enrollments.map((e) => (
            <EnrollmentCard key={e.id} enrollment={e} onReview={review} />
          ))}
          {enrollments.length === 0 && <p className="text-sm text-ink-600">No enrollment requests in this view.</p>}
        </div>
      )}
    </div>
  );
}

function EnrollmentCard({
  enrollment: e,
  onReview,
}: {
  enrollment: Row;
  onReview: (id: string, decision: EnrollmentStatus, note: string) => Promise<boolean>;
}) {
  const supabase = createClient();
  const [note, setNote] = useState(e.admin_note ?? "");
  const [pending, setPending] = useState(false);
  const [proofLoading, setProofLoading] = useState(false);

  async function handleDecision(decision: EnrollmentStatus) {
    setPending(true);
    await onReview(e.id, decision, note);
    setPending(false);
  }

  async function viewProof() {
    if (!e.payment_proof_path) return;
    setProofLoading(true);
    const { data, error } = await supabase.storage.from("payment-proofs").createSignedUrl(e.payment_proof_path, 600);
    setProofLoading(false);
    if (!error && data) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <Card className="bg-base-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-ink-100">{e.full_name}</p>
            <Badge status={e.status}>{e.status}</Badge>
          </div>
          <p className="mt-1 text-sm text-ink-600">{e.email} · {e.phone}</p>
          <p className="mt-1 text-xs text-ink-700">Submitted {formatDate(e.created_at)}</p>
        </div>
        <div className="text-right text-sm text-ink-400">
          <p>{e.courses?.title ?? "Course"}</p>
          <p className="text-ink-100">{e.currency} {e.amount}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 border-t border-base-800 pt-4 text-sm sm:grid-cols-2">
        <p><span className="text-ink-600">Method:</span> <span className="text-ink-300">{e.payment_method}</span></p>
        <p><span className="text-ink-600">Reference:</span> <span className="text-ink-300">{e.transaction_reference}</span></p>
        <p><span className="text-ink-600">Payment date:</span> <span className="text-ink-300">{e.payment_date}</span></p>
        {e.payment_proof_path && (
          <button
            type="button"
            onClick={viewProof}
            disabled={proofLoading}
            className="text-left text-sm text-accent underline-offset-2 hover:text-accent-soft hover:underline"
          >
            {proofLoading ? "Loading…" : "View payment proof"}
          </button>
        )}
      </div>

      {e.message && <p className="mt-3 rounded-lg bg-base-950 p-3 text-sm text-ink-400">&quot;{e.message}&quot;</p>}
      {e.admin_note && e.status !== "pending" && (
        <p className="mt-3 text-sm text-ink-600"><span className="text-ink-700">Admin note:</span> {e.admin_note}</p>
      )}

      {e.status === "pending" && (
        <div className="mt-3 space-y-2">
          <Textarea placeholder="Admin note (optional)" rows={2} value={note} onChange={(ev) => setNote(ev.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" disabled={pending} onClick={() => handleDecision("approved")}>Approve</Button>
            <Button size="sm" variant="danger" disabled={pending} onClick={() => handleDecision("rejected")}>Reject</Button>
          </div>
        </div>
      )}
    </Card>
  );
}
