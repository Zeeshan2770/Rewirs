"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Label, Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { PublishToggle } from "@/components/publish-toggle";
import { Spinner } from "@/components/route-guards";
import { cn, slugify, linesToArray } from "@/lib/utils";
import type { Lesson } from "@/lib/types/database";

export default function AdminLessonsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <LessonsContent />
    </Suspense>
  );
}

function LessonsContent() {
  const searchParams = useSearchParams();
  const moduleParam = searchParams.get("module");
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState<{ id: string; title: string }[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    async function load() {
      const { data: course } = await supabase.from("courses").select("id").eq("slug", "superchad").maybeSingle();
      if (!course) {
        setLoading(false);
        return;
      }
      const { data: moduleRows } = await supabase
        .from("modules")
        .select("id, title")
        .eq("course_id", course.id)
        .order("sort_order");
      setModules(moduleRows ?? []);
      setActiveModuleId(moduleParam ?? moduleRows?.[0]?.id ?? null);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (moduleParam) setActiveModuleId(moduleParam);
  }, [moduleParam]);

  useEffect(() => {
    if (!activeModuleId) return;
    supabase
      .from("lessons")
      .select("*")
      .eq("module_id", activeModuleId)
      .order("sort_order")
      .then(({ data }) => setLessons(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModuleId]);

  function replaceLesson(l: Lesson) {
    setLessons((rows) => rows.map((r) => (r.id === l.id ? l : r)));
  }

  async function deleteLesson(id: string) {
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (!error) setLessons((rows) => rows.filter((r) => r.id !== id));
  }

  async function reorder(id: string, direction: "up" | "down") {
    const sorted = [...lessons].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((l) => l.id === id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx];
    const b = sorted[swapIdx];
    await Promise.all([
      supabase.from("lessons").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("lessons").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    setLessons((rows) =>
      rows.map((r) => {
        if (r.id === a.id) return { ...r, sort_order: b.sort_order };
        if (r.id === b.id) return { ...r, sort_order: a.sort_order };
        return r;
      })
    );
  }

  async function uploadThumbnail(lessonId: string, file: File): Promise<string | undefined> {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `lessons/${lessonId}/thumbnail-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("course-media").upload(path, file, { contentType: file.type, upsert: true });
    if (error) return undefined;
    const { data } = supabase.storage.from("course-media").getPublicUrl(path);
    return data.publicUrl;
  }

  if (loading) return <Spinner />;
  if (modules.length === 0) return <p className="text-sm text-ink-600">Create a module first under Admin → Modules.</p>;

  const sortedLessons = [...lessons].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-100">Lessons</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {modules.map((m) => (
          <Link
            key={m.id}
            href={`/admin/lessons/?module=${m.id}`}
            onClick={() => setActiveModuleId(m.id)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm",
              activeModuleId === m.id ? "border-accent bg-accent/10 text-accent" : "border-base-700 text-ink-400"
            )}
          >
            {m.title}
          </Link>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {sortedLessons.map((l, i) => (
          <LessonRowCard
            key={l.id}
            lesson={l}
            index={i}
            total={sortedLessons.length}
            onSaved={replaceLesson}
            onDelete={deleteLesson}
            onReorder={reorder}
            uploadThumbnail={uploadThumbnail}
          />
        ))}
        {sortedLessons.length === 0 && <p className="text-sm text-ink-600">No lessons in this module yet.</p>}
      </div>

      {activeModuleId && (
        <div className="mt-6">
          <LessonCreateForm
            moduleId={activeModuleId}
            nextOrder={lessons.length + 1}
            onCreated={(l) => setLessons((rows) => [...rows, l])}
            uploadThumbnail={uploadThumbnail}
          />
        </div>
      )}
    </div>
  );
}

function LessonRowCard({
  lesson,
  index,
  total,
  onSaved,
  onDelete,
  onReorder,
  uploadThumbnail,
}: {
  lesson: Lesson;
  index: number;
  total: number;
  onSaved: (l: Lesson) => void;
  onDelete: (id: string) => Promise<void>;
  onReorder: (id: string, dir: "up" | "down") => Promise<void>;
  uploadThumbnail: (id: string, file: File) => Promise<string | undefined>;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [values, setValues] = useState({
    title: lesson.title,
    slug: lesson.slug,
    description: lesson.description,
    video_url: lesson.video_url ?? "",
    content: lesson.content,
    key_takeaways: lesson.key_takeaways.join("\n"),
    checklist: lesson.checklist.join("\n"),
    is_preview: lesson.is_preview,
  });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (values.title.trim().length < 2) {
      setError("Enter a lesson title.");
      return;
    }
    setPending(true);
    setError(null);

    let thumbnailUrl: string | undefined;
    if (thumbnail) thumbnailUrl = await uploadThumbnail(lesson.id, thumbnail);

    const { data, error: updateError } = await supabase
      .from("lessons")
      .update({
        title: values.title.trim(),
        slug: slugify(values.slug || values.title),
        description: values.description,
        video_url: values.video_url || null,
        content: values.content,
        key_takeaways: linesToArray(values.key_takeaways),
        checklist: linesToArray(values.checklist),
        is_preview: values.is_preview,
        ...(thumbnailUrl ? { thumbnail_url: thumbnailUrl } : {}),
      })
      .eq("id", lesson.id)
      .select()
      .single();

    setPending(false);
    if (updateError || !data) {
      setError("Couldn't update lesson.");
      return;
    }
    onSaved(data as unknown as Lesson);
  }

  async function handleTogglePublished(next: boolean) {
    const { data } = await supabase.from("lessons").update({ published: next }).eq("id", lesson.id).select().single();
    if (data) onSaved(data as unknown as Lesson);
  }

  async function handleTogglePreview() {
    const next = !values.is_preview;
    setValues((v) => ({ ...v, is_preview: next }));
    const { data } = await supabase.from("lessons").update({ is_preview: next }).eq("id", lesson.id).select().single();
    if (data) onSaved(data as unknown as Lesson);
  }

  return (
    <div className="rounded-2xl border border-base-700 bg-base-900 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <button disabled={index === 0} onClick={() => onReorder(lesson.id, "up")} className="text-ink-600 hover:text-ink-100 disabled:opacity-30">▲</button>
            <button disabled={index === total - 1} onClick={() => onReorder(lesson.id, "down")} className="text-ink-600 hover:text-ink-100 disabled:opacity-30">▼</button>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-ink-100">{lesson.title}</p>
              {values.is_preview && <Badge status="published">Preview</Badge>}
            </div>
            <p className="text-sm text-ink-600">/{lesson.slug}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PublishToggle published={lesson.published} onToggle={handleTogglePublished} />
          <Button size="sm" variant="secondary" onClick={handleTogglePreview}>
            {values.is_preview ? "Unset preview" : "Mark free preview"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>{open ? "Close" : "Edit"}</Button>
          {confirmingDelete ? (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="danger" onClick={() => onDelete(lesson.id)}>Confirm</Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmingDelete(false)}>Cancel</Button>
            </div>
          ) : (
            <Button size="sm" variant="danger" onClick={() => setConfirmingDelete(true)}>Delete</Button>
          )}
        </div>
      </div>

      {open && (
        <form onSubmit={handleSave} className="mt-5 space-y-4 border-t border-base-800 pt-5">
          {error && <Alert variant="error">{error}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Title</Label>
              <Input value={values.title} onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))} required />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={values.slug} onChange={(e) => setValues((v) => ({ ...v, slug: e.target.value }))} required />
            </div>
          </div>
          <div>
            <Label>Short description</Label>
            <Input value={values.description} onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))} />
          </div>
          <div>
            <Label>Video URL (YouTube, Vimeo, or direct file)</Label>
            <Input value={values.video_url} onChange={(e) => setValues((v) => ({ ...v, video_url: e.target.value }))} />
          </div>
          <div>
            <Label>Written content (paragraphs separated by a blank line)</Label>
            <Textarea rows={8} value={values.content} onChange={(e) => setValues((v) => ({ ...v, content: e.target.value }))} />
          </div>
          <div>
            <Label>Key takeaways (one per line)</Label>
            <Textarea rows={4} value={values.key_takeaways} onChange={(e) => setValues((v) => ({ ...v, key_takeaways: e.target.value }))} />
          </div>
          <div>
            <Label>Practical checklist (one per line)</Label>
            <Textarea rows={4} value={values.checklist} onChange={(e) => setValues((v) => ({ ...v, checklist: e.target.value }))} />
          </div>
          <div>
            <Label>Replace thumbnail</Label>
            <Input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)} />
          </div>
          <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : "Save lesson"}</Button>
        </form>
      )}
    </div>
  );
}

function LessonCreateForm({
  moduleId,
  nextOrder,
  onCreated,
  uploadThumbnail,
}: {
  moduleId: string;
  nextOrder: number;
  onCreated: (l: Lesson) => void;
  uploadThumbnail: (id: string, file: File) => Promise<string | undefined>;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({
    title: "",
    video_url: "",
    description: "",
    content: "",
    key_takeaways: "",
    checklist: "",
    is_preview: false,
  });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>+ Add lesson</Button>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (values.title.trim().length < 2) {
      setError("Enter a lesson title.");
      return;
    }
    setPending(true);
    setError(null);

    const { data: lesson, error: insertError } = await supabase
      .from("lessons")
      .insert({
        module_id: moduleId,
        title: values.title.trim(),
        slug: slugify(values.title),
        description: values.description,
        video_url: values.video_url || null,
        content: values.content,
        key_takeaways: linesToArray(values.key_takeaways),
        checklist: linesToArray(values.checklist),
        is_preview: values.is_preview,
        sort_order: nextOrder,
        published: false,
      })
      .select()
      .single();

    if (insertError || !lesson) {
      setPending(false);
      setError("Couldn't create lesson (slug may already exist).");
      return;
    }

    let finalLesson = lesson as unknown as Lesson;
    if (thumbnail) {
      const url = await uploadThumbnail(lesson.id, thumbnail);
      if (url) {
        const { data: updated } = await supabase.from("lessons").update({ thumbnail_url: url }).eq("id", lesson.id).select().single();
        if (updated) finalLesson = updated as unknown as Lesson;
      }
    }

    setPending(false);
    onCreated(finalLesson);
    setOpen(false);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-dashed border-base-700 p-5">
      {error && <Alert variant="error">{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Title</Label>
          <Input required value={values.title} onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))} />
        </div>
        <div>
          <Label>Video URL</Label>
          <Input value={values.video_url} onChange={(e) => setValues((v) => ({ ...v, video_url: e.target.value }))} />
        </div>
      </div>
      <div className="mt-4">
        <Label>Short description</Label>
        <Input value={values.description} onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))} />
      </div>
      <div className="mt-4">
        <Label>Written content</Label>
        <Textarea rows={5} value={values.content} onChange={(e) => setValues((v) => ({ ...v, content: e.target.value }))} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label>Key takeaways (one per line)</Label>
          <Textarea rows={3} value={values.key_takeaways} onChange={(e) => setValues((v) => ({ ...v, key_takeaways: e.target.value }))} />
        </div>
        <div>
          <Label>Checklist (one per line)</Label>
          <Textarea rows={3} value={values.checklist} onChange={(e) => setValues((v) => ({ ...v, checklist: e.target.value }))} />
        </div>
      </div>
      <div className="mt-4">
        <Label>Thumbnail</Label>
        <Input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)} />
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-ink-300">
        <input type="checkbox" checked={values.is_preview} onChange={(e) => setValues((v) => ({ ...v, is_preview: e.target.checked }))} className="accent-accent" />
        Free preview
      </label>
      <div className="mt-5 flex gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Adding…" : "Add lesson"}</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
