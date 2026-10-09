import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, LabelHTMLAttributes } from "react";

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label {...props} className={cn("mb-1.5 block text-sm text-ink-300", props.className)} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-base-700 bg-base-900 px-3.5 py-2.5 text-sm text-ink-100 placeholder:text-ink-700 outline-none transition-colors focus:border-accent",
        className
      )}
      {...props}
    />
  );
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mt-1.5 text-sm text-red-400">{children}</p>;
}
