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
import type { Course } from "@/lib/types/database";

export default function AdminCoursesPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    supabase
      .from("courses")
      .select("*")
      .order("created_at")
      .then(({ data }) => {
        setCourses(data ?? []);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function replaceCourse(course: Course) {
    setCourses((rows) => rows.map((c) => (c.id === course.id ? course : c)));
  }

  async function uploadThumbnail(courseId: string, file: File): Promise<string | undefined> {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `courses/${courseId}/thumbnail-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("course-media").upload(path, file, { contentType: file.type, upsert: true });
    if (error) return undefined;
    const { data } = supabase.storage.from("course-media").getPublicUrl(path);
    return data.publicUrl;
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink-100">Courses</h1>
        {!showCreate && (
          <Button variant="secondary" onClick={() => setShowCreate(true)}>+ New course</Button>
        )}
      </div>

      {showCreate && (
        <div className="mt-6">
          <CourseCreateForm
            onCancel={() => setShowCreate(false)}
            onCreated={(course) => {
              setCourses((rows) => [...rows, course]);
              setShowCreate(false);
            }}
            uploadThumbnail={uploadThumbnail}
          />
        </div>
      )}

      <div className="mt-6 space-y-4">
        {courses.map((course) => (
          <CourseEditCard key={course.id} course={course} onSaved={replaceCourse} uploadThumbnail={uploadThumbnail} />
        ))}
        {courses.length === 0 && !showCreate && <p className="text-sm text-ink-600">No courses yet.</p>}
      </div>
    </div>
  );
}

function CourseCreateForm({
  onCreated,
  onCancel,
  uploadThumbnail,
}: {
  onCreated: (course: Course) => void;
  onCancel: () => void;
  uploadThumbnail: (id: string, file: File) => Promise<string | undefined>;
}) {
  const supabase = createClient();
  const [values, setValues] = useState({ title: "", slug: "", short_description: "", description: "", price: 750, currency: "PKR" });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (values.title.trim().length < 2) {
      setError("Enter a course title.");
      return;
    }
    setPending(true);
    setError(null);

    const { data: course, error: insertError } = await supabase
      .from("courses")
      .insert({
        title: values.title.trim(),
        slug: values.slug ? slugify(values.slug) : slugify(values.title),
        short_description: values.short_description,
        description: values.description,
        price: values.price,
        currency: values.currency,
        published: false,
      })
      .select()
      .single();

    if (insertError || !course) {
      setPending(false);
      setError("Couldn't create course. The slug may already be in use.");
      return;
    }

    let finalCourse = course as unknown as Course;
    if (thumbnail) {
      const url = await uploadThumbnail(course.id, thumbnail);
      if (url) {
        const { data: updated } = await supabase.from("courses").update({ thumbnail_url: url }).eq("id", course.id).select().single();
        if (updated) finalCourse = updated as unknown as Course;
      }
    }

    setPending(false);
    onCreated(finalCourse);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-base-700 bg-base-900 p-6">
      {error && <Alert variant="error">{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="new-title">Title</Label>
          <Input id="new-title" required value={values.title} onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="new-slug">Slug (optional)</Label>
          <Input id="new-slug" placeholder="auto-generated from title" value={values.slug} onChange={(e) => setValues((v) => ({ ...v, slug: e.target.value }))} />
        </div>
        <div>
          <Label htmlFor="new-price">Price</Label>
          <Input id="new-price" type="number" step="0.01" value={values.price} onChange={(e) => setValues((v) => ({ ...v, price: Number(e.target.value) }))} required />
        </div>
        <div>
          <Label htmlFor="new-currency">Currency</Label>
          <Input id="new-currency" value={values.currency} onChange={(e) => setValues((v) => ({ ...v, currency: e.target.value }))} required />
        </div>
      </div>
      <div className="mt-4">
        <Label htmlFor="new-short">Short description</Label>
        <Textarea id="new-short" rows={2} value={values.short_description} onChange={(e) => setValues((v) => ({ ...v, short_description: e.target.value }))} />
      </div>
      <div className="mt-4">
        <Label htmlFor="new-desc">Full description</Label>
        <Textarea id="new-desc" rows={4} value={values.description} onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))} />
      </div>
      <div className="mt-4">
        <Label htmlFor="new-thumb">Thumbnail</Label>
        <Input id="new-thumb" type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)} />
      </div>
      <div className="mt-5 flex gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Creating…" : "Create course"}</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

function CourseEditCard({
  course,
  onSaved,
  uploadThumbnail,
}: {
  course: Course;
  onSaved: (course: Course) => void;
  uploadThumbnail: (id: string, file: File) => Promise<string | undefined>;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({
    title: course.title,
    slug: course.slug,
    short_description: course.short_description,
    description: course.description,
    price: course.price,
    currency: course.currency,
  });
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (values.title.trim().length < 2) {
      setError("Enter a course title.");
      return;
    }
    setPending(true);
    setError(null);

    let thumbnailUrl: string | undefined;
    if (thumbnail) thumbnailUrl = await uploadThumbnail(course.id, thumbnail);

    const { data, error: updateError } = await supabase
      .from("courses")
      .update({
        title: values.title.trim(),
        slug: slugify(values.slug || values.title),
        short_description: values.short_description,
        description: values.description,
        price: values.price,
        currency: values.currency,
        ...(thumbnailUrl ? { thumbnail_url: thumbnailUrl } : {}),
      })
      .eq("id", course.id)
      .select()
      .single();

    setPending(false);
    if (updateError || !data) {
      setError("Couldn't update course.");
      return;
    }
    onSaved(data as unknown as Course);
  }

  async function handleTogglePublished(next: boolean) {
    const { data } = await supabase.from("courses").update({ published: next }).eq("id", course.id).select().single();
    if (data) onSaved(data as unknown as Course);
  }

  return (
    <div className="rounded-2xl border border-base-700 bg-base-900 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {course.thumbnail_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.thumbnail_url} alt="" className="h-14 w-14 rounded-lg object-cover" />
          )}
          <div>
            <p className="text-ink-100">{course.title}</p>
            <p className="text-sm text-ink-600">/{course.slug} · {course.currency} {course.price}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <PublishToggle published={course.published} onToggle={handleTogglePublished} />
          <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>{open ? "Close" : "Edit"}</Button>
        </div>
      </div>

      {open && (
        <form onSubmit={handleSave} className="mt-6 space-y-4 border-t border-base-800 pt-6">
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Price</Label>
              <Input type="number" step="0.01" value={values.price} onChange={(e) => setValues((v) => ({ ...v, price: Number(e.target.value) }))} required />
            </div>
            <div>
              <Label>Currency</Label>
              <Input value={values.currency} onChange={(e) => setValues((v) => ({ ...v, currency: e.target.value }))} required />
            </div>
          </div>
          <div>
            <Label>Short description</Label>
            <Textarea rows={2} value={values.short_description} onChange={(e) => setValues((v) => ({ ...v, short_description: e.target.value }))} />
          </div>
          <div>
            <Label>Full description</Label>
            <Textarea rows={4} value={values.description} onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))} />
          </div>
          <div>
            <Label>Replace thumbnail</Label>
            <Input type="file" accept="image/*" onChange={(e) => setThumbnail(e.target.files?.[0] ?? null)} />
          </div>
          <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
        </form>
      )}
    </div>
  );
}
