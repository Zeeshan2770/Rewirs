"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Spinner } from "@/components/route-guards";

type MediaItem = { name: string; path: string; url: string };

export default function AdminMediaPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const { data: files } = await supabase.storage.from("course-media").list("library", {
      sortBy: { column: "created_at", order: "desc" },
    });
    const mapped = (files ?? [])
      .filter((f) => f.name !== ".emptyFolderPlaceholder")
      .map((f) => {
        const path = `library/${f.name}`;
        const { data } = supabase.storage.from("course-media").getPublicUrl(path);
        return { name: f.name, path, url: data.publicUrl };
      });
    setItems(mapped);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File must be under 10MB.");
      return;
    }
    setUploading(true);
    setError(null);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `library/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("course-media").upload(path, file, { contentType: file.type });
    setUploading(false);
    if (uploadError) {
      setError("Upload failed. Try again.");
      return;
    }
    setFile(null);
    refresh();
  }

  async function handleDelete(path: string) {
    setItems((rows) => rows.filter((r) => r.path !== path));
    await supabase.storage.from("course-media").remove([path]);
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-100">Media library</h1>
      <p className="mt-1 text-sm text-ink-600">
        Publicly-readable images for course and lesson thumbnails. Upload here, then paste the URL
        where needed, or upload directly from the course/lesson edit forms.
      </p>

      <form onSubmit={handleUpload} className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-dashed border-base-700 p-5">
        <div className="flex-1">
          {error && <Alert variant="error">{error}</Alert>}
          <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-2" />
        </div>
        <Button type="submit" disabled={uploading}>{uploading ? "Uploading…" : "Upload"}</Button>
      </form>

      {loading ? (
        <Spinner />
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {items.map((item) => (
            <div key={item.path} className="overflow-hidden rounded-xl border border-base-700 bg-base-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={item.name} className="h-32 w-full object-cover" />
              <div className="flex items-center justify-between p-2">
                <p className="truncate text-xs text-ink-500">{item.name}</p>
                <button onClick={() => handleDelete(item.path)} className="text-xs text-red-400 hover:text-red-300">
                  Delete
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-ink-600">No uploads yet.</p>}
        </div>
      )}
    </div>
  );
}
