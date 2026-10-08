import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  rejected: "bg-red-500/10 text-red-400 border-red-500/30",
  cancelled: "bg-ink-700/20 text-ink-500 border-base-700",
  unread: "bg-accent/10 text-accent border-accent/30",
  read: "bg-ink-700/20 text-ink-500 border-base-700",
  replied: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  archived: "bg-ink-700/20 text-ink-500 border-base-700",
  admin: "bg-accent/10 text-accent border-accent/30",
  student: "bg-ink-700/20 text-ink-300 border-base-700",
  published: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  draft: "bg-ink-700/20 text-ink-500 border-base-700",
};

export function Badge({ status, children }: { status: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize",
        styles[status] ?? styles.draft
      )}
    >
      {children}
    </span>
  );
}
