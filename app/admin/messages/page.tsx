"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/route-guards";
import { formatDate, cn } from "@/lib/utils";
import type { ContactMessage, MessageStatus } from "@/lib/types/database";

const TABS = ["all", "unread", "read", "replied", "archived"] as const;
const NEXT_OPTIONS: { value: MessageStatus; label: string }[] = [
  { value: "read", label: "Mark read" },
  { value: "replied", label: "Mark replied" },
  { value: "archived", label: "Archive" },
];

export default function AdminMessagesPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const activeTab = (TABS as readonly string[]).includes(status ?? "") ? (status as (typeof TABS)[number]) : "all";

  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      let query = supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
      if (activeTab !== "all") query = query.eq("status", activeTab);
      const { data } = await query;
      if (!cancelled) {
        setMessages(data ?? []);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function setStatus(id: string, next: MessageStatus) {
    setMessages((rows) => rows.map((m) => (m.id === id ? { ...m, status: next } : m)));
    await supabase.from("contact_messages").update({ status: next }).eq("id", id);
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink-100">Messages</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab}
            href={tab === "all" ? "/admin/messages/" : `/admin/messages/?status=${tab}`}
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
          {messages.map((m) => (
            <Card key={m.id} className="bg-base-900">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-ink-100">{m.name}</p>
                    <Badge status={m.status}>{m.status}</Badge>
                  </div>
                  <a href={`mailto:${m.email}`} className="text-sm text-ink-600 hover:text-accent">{m.email}</a>
                  <p className="mt-1 text-xs text-ink-700">{formatDate(m.created_at)}</p>
                </div>
              </div>
              <p className="mt-3 rounded-lg bg-base-950 p-3 text-sm text-ink-300">{m.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {NEXT_OPTIONS.filter((o) => o.value !== m.status).map((o) => (
                  <Button key={o.value} size="sm" variant="secondary" onClick={() => setStatus(m.id, o.value)}>
                    {o.label}
                  </Button>
                ))}
              </div>
            </Card>
          ))}
          {messages.length === 0 && <p className="text-sm text-ink-600">No messages in this view.</p>}
        </div>
      )}
    </div>
  );
}
