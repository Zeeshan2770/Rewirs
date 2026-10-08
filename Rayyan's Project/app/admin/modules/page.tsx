"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Label, Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { PublishToggle } from "@/components/publish-toggle";
import { Spinner } from "@/components/route-guards";
import { slugify } from "@/lib/utils";
import type { CourseModule } from "@/lib/types/database";

type ModuleRow = CourseModule & { lessons: { id: string }[] };

export default function AdminModulesPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [modules, setModules] = useState<ModuleRow[]>([]);

  useEffect(() => {
    async function load() {
      const { data: course } = await supabase.from("courses").select("id, title").eq("slug", "superchad").maybeSingle();
      if (!course) {
        setLoading(false);
        return;
      }
      setCourseId(course.id);
      setCourseTitle(course.title);
      const { data } = await supabase
        .from("modules")
        .select("*, lessons(id)")
        .eq("course_id", course.id)
        .order("sort_order");
      setModules((data as unknown as ModuleRow[]) ?? []);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function replaceModule(m: CourseModule) {
    setModules((rows) => rows.map((r) => (r.id === m.id ? { ...r, ...m } : r)));
  }

  async function deleteModule(id: string) {
    const { error } = await supabase.from("modules").delete().eq("id", id);
    if (!error) setModules((rows) => rows.filter((r) => r.id !== id));
  }

  async function reorder(id: string, direction: "up" | "down") {
    const sorted = [...modules].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((m) => m.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    await Promise.all([
      supabase.from("modules").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("modules").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    setModules((rows) =>
      rows.map((r) => {
        if (r.id === a.id) return { ...r, sort_order: b.sort_order };
        if (r.id === b.id) return { ...r, sort_order: a.sort_order };
        return r;
      })
    );
  }

  if (loading) return <Spinner />;
  if (!courseId) return <p className="text-sm text-ink-600">Create a course first under Admin → Courses.</p>;

  const sorted = [...modules].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-100">Modules</h1>
      <p className="mt-1 text-sm text-ink-600">{courseTitle}</p>

      <div className="mt-6 space-y-4">
        {sorted.map((m, i) => (
          <ModuleRowCard
            key={m.id}
            module={m}
            index={i}
            total={sorted.length}
            lessonCount={m.lessons?.length ?? 0}
            onSaved={replaceModule}
            onDelete={deleteModule}
            onReorder={reorder}
          />
        ))}
      </div>

      <div className="mt-6">
        <ModuleCreateForm
          courseId={courseId}
          nextOrder={modules.length + 1}
          onCreated={(m) => setModules((rows) => [...rows, { ...m, lessons: [] }])}
        />
      </div>
    </div>
  );
}

function ModuleRowCard({
  module: m,
  index,
  total,
  lessonCount,
  onSaved,
  onDelete,
  onReorder,
}: {
  module: CourseModule;
  index: number;
  total: number;
  lessonCount: number;
  onSaved: (m: CourseModule) => void;
  onDelete: (id: string) => Promise<void>;
  onReorder: (id: string, dir: "up" | "down") => Promise<void>;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [values, setValues] = useState({ title: m.title, slug: m.slug, description: m.description });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (values.title.trim().length < 2) {
      setError("Enter a module title.");
      return;
    }
    setPending(true);
    setError(null);
    const { data, error: updateError } = await supabase
      .from("modules")
      .update({ title: values.title.trim(), slug: slugify(values.slug || values.title), description: values.description })
      .eq("id", m.id)
      .select()
      .single();
    setPending(false);
    if (updateError || !data) {
      setError("Couldn't update module.");
      return;
    }
    onSaved(data as unknown as CourseModule);
  }

  async function handleTogglePublished(next: boolean) {
    const { data } = await supabase.from("modules").update({ published: next }).eq("id", m.id).select().single();
    if (data) onSaved(data as unknown as CourseModule);
  }

  return (
    <div className="rounded-2xl border border-base-700 bg-base-900 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <button disabled={index === 0} onClick={() => onReorder(m.id, "up")} className="text-ink-600 hover:text-ink-100 disabled:opacity-30">▲</button>
            <button disabled={index === total - 1} onClick={() => onReorder(m.id, "down")} className="text-ink-600 hover:text-ink-100 disabled:opacity-30">▼</button>
          </div>
          <div>
            <p className="text-ink-100">{m.title}</p>
            <p className="text-sm text-ink-600">/{m.slug} · {lessonCount} lessons</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <PublishToggle published={m.published} onToggle={handleTogglePublished} />
          <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>{open ? "Close" : "Edit"}</Button>
          {confirmingDelete ? (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="danger" onClick={() => onDelete(m.id)}>Confirm</Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(false)}>Cancel</Button>
            </div>
          ) : (
            <Button size="sm" variant="danger" onClick={() => setConfirmingDelete(true)}>Delete</Button>
          )}
        </div>
      </div>

      {open && (
        <form onSubmit={handleSave} className="mt-5 space-y-3 border-t border-base-800 pt-5">
          {error && <Alert variant="error">{error}</Alert>}
          <div>
            <Label>Title</Label>
            <Input value={values.title} onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))} required />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={values.slug} onChange={(e) => setValues((v) => ({ ...v, slug: e.target.value }))} required />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={values.description} onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))} />
          </div>
          <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
        </form>
      )}
    </div>
  );
}

function ModuleCreateForm({
  courseId,
  nextOrder,
  onCreated,
}: {
  courseId: string;
  nextOrder: number;
  onCreated: (m: CourseModule) => void;
}) {
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 2) {
      setError("Enter a module title.");
      return;
    }
    setPending(true);
    setError(null);
    const { data, error: insertError } = await supabase
      .from("modules")
      .insert({ course_id: courseId, title: title.trim(), slug: slugify(title), description, sort_order: nextOrder, published: false })
      .select()
      .single();
    setPending(false);
    if (insertError || !data) {
      setError("Couldn't create module (slug may already exist).");
      return;
    }
    onCreated(data as unknown as CourseModule);
    setTitle("");
    setDescription("");
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-dashed border-base-700 p-5">
      {error && <Alert variant="error">{error}</Alert>}
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <Label htmlFor="new-module-title">Title</Label>
          <Input id="new-module-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="new-module-desc">Description</Label>
          <Input id="new-module-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <Button type="submit" disabled={pending}>{pending ? "Adding…" : "Add module"}</Button>
      </div>
    </form>
  );
}
