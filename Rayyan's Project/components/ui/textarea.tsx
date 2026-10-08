import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-xl border border-base-700 bg-base-900 px-3.5 py-2.5 text-sm text-ink-100 placeholder:text-ink-700 outline-none transition-colors focus:border-accent",
        className
      )}
      {...props}
    />
  );
}
