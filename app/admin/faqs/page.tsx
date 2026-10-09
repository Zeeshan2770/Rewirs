"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Label, Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { PublishToggle } from "@/components/publish-toggle";
import { Spinner } from "@/components/route-guards";
import type { Faq } from "@/lib/types/database";

export default function AdminFaqsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState<Faq[]>([]);

  useEffect(() => {
    supabase
      .from("faqs")
      .select("*")
      .order("sort_order")
      .then(({ data }) => {
        setFaqs(data ?? []);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function replaceFaq(f: Faq) {
    setFaqs((rows) => rows.map((r) => (r.id === f.id ? f : r)));
  }

  async function deleteFaq(id: string) {
    const { error } = await supabase.from("faqs").delete().eq("id", id);
    if (!error) setFaqs((rows) => rows.filter((r) => r.id !== id));
  }

  async function reorder(id: string, direction: "up" | "down") {
    const sorted = [...faqs].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((f) => f.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    await Promise.all([
      supabase.from("faqs").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("faqs").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    setFaqs((rows) =>
      rows.map((r) => {
        if (r.id === a.id) return { ...r, sort_order: b.sort_order };
        if (r.id === b.id) return { ...r, sort_order: a.sort_order };
        return r;
      })
    );
  }

  if (loading) return <Spinner />;
  const sorted = [...faqs].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-100">FAQs</h1>
      <div className="mt-6 space-y-4">
        {sorted.map((f, i) => (
          <FaqRowCard key={f.id} faq={f} index={i} total={sorted.length} onSaved={replaceFaq} onDelete={deleteFaq} onReorder={reorder} />
        ))}
      </div>
      <div className="mt-6">
        <FaqCreateForm nextOrder={faqs.length + 1} onCreated={(f) => setFaqs((rows) => [...rows, f])} />
      </div>
    </div>
  );
}

function FaqRowCard({
  faq,
  index,
  total,
  onSaved,
  onDelete,
  onReorder,
}: {
  faq: Faq;
  index: number;
  total: number;
  onSaved: (f: Faq) => void;
  onDelete: (id: string) => Promise<void>;
  onReorder: (id: string, dir: "up" | "down") => Promise<void>;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [values, setValues] = useState({ question: faq.question, answer: faq.answer });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (values.question.trim().length < 3 || values.answer.trim().length < 3) {
      setError("Enter both a question and an answer.");
      return;
    }
    setPending(true);
    setError(null);
    const { data, error: updateError } = await supabase
      .from("faqs")
      .update({ question: values.question.trim(), answer: values.answer.trim() })
      .eq("id", faq.id)
      .select()
      .single();
    setPending(false);
    if (updateError || !data) {
      setError("Couldn't update FAQ.");
      return;
    }
    onSaved(data as unknown as Faq);
  }

  async function handleTogglePublished(next: boolean) {
    const { data } = await supabase.from("faqs").update({ published: next }).eq("id", faq.id).select().single();
    if (data) onSaved(data as unknown as Faq);
  }

  return (
    <div className="rounded-2xl border border-base-700 bg-base-900 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <button disabled={index === 0} onClick={() => onReorder(faq.id, "up")} className="text-ink-600 hover:text-ink-100 disabled:opacity-30">▲</button>
            <button disabled={index === total - 1} onClick={() => onReorder(faq.id, "down")} className="text-ink-600 hover:text-ink-100 disabled:opacity-30">▼</button>
          </div>
          <p className="max-w-md text-ink-100">{faq.question}</p>
        </div>
        <div className="flex items-center gap-3">
          <PublishToggle published={faq.published} onToggle={handleTogglePublished} />
          <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>{open ? "Close" : "Edit"}</Button>
          {confirmingDelete ? (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="danger" onClick={() => onDelete(faq.id)}>Confirm</Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(false)}>Cancel</Button>
            </div>
          ) : (
            <Button size="sm" variant="danger" onClick={() => setConfirmingDelete(true)}>Delete</Button>
          )}
        </div>
      </div>

      {open && (
        <form onSubmit={handleSave} className="mt-4 space-y-3 border-t border-base-800 pt-4">
          {error && <Alert variant="error">{error}</Alert>}
          <div>
            <Label>Question</Label>
            <Input value={values.question} onChange={(e) => setValues((v) => ({ ...v, question: e.target.value }))} required />
          </div>
          <div>
            <Label>Answer</Label>
            <Textarea rows={3} value={values.answer} onChange={(e) => setValues((v) => ({ ...v, answer: e.target.value }))} required />
          </div>
          <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
        </form>
      )}
    </div>
  );
}

function FaqCreateForm({ nextOrder, onCreated }: { nextOrder: number; onCreated: (f: Faq) => void }) {
  const supabase = createClient();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (question.trim().length < 3 || answer.trim().length < 3) {
      setError("Enter both a question and an answer.");
      return;
    }
    setPending(true);
    setError(null);
    const { data, error: insertError } = await supabase
      .from("faqs")
      .insert({ question: question.trim(), answer: answer.trim(), sort_order: nextOrder, published: true })
      .select()
      .single();
    setPending(false);
    if (insertError || !data) {
      setError("Couldn't create FAQ.");
      return;
    }
    onCreated(data as unknown as Faq);
    setQuestion("");
    setAnswer("");
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-dashed border-base-700 p-5">
      {error && <Alert variant="error">{error}</Alert>}
      <div>
        <Label htmlFor="new-faq-q">Question</Label>
        <Input id="new-faq-q" required value={question} onChange={(e) => setQuestion(e.target.value)} />
      </div>
      <div className="mt-3">
        <Label htmlFor="new-faq-a">Answer</Label>
        <Textarea id="new-faq-a" rows={3} required value={answer} onChange={(e) => setAnswer(e.target.value)} />
      </div>
      <div className="mt-4">
        <Button type="submit" disabled={pending}>{pending ? "Adding…" : "Add FAQ"}</Button>
      </div>
    </form>
  );
}
