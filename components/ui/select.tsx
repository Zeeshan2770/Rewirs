import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-xl border border-base-700 bg-base-900 px-3.5 py-2.5 text-sm text-ink-100 outline-none transition-colors focus:border-accent",
        className
      )}
      {...props}
    />
  );
}
