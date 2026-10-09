import Link from "next/link";

export function Logo({ siteName }: { siteName: string }) {
  return (
    <Link href="/" className="flex items-center gap-2 text-ink-100">
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-accent/40 font-display text-sm text-accent">
        R
      </span>
      <span className="font-display text-lg tracking-tight">{siteName}</span>
    </Link>
  );
}
