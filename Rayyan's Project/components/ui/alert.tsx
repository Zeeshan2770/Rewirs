import { cn } from "@/lib/utils";

export function Alert({
  variant = "info",
  children,
}: {
  variant?: "info" | "success" | "error";
  children: React.ReactNode;
}) {
  const styles = {
    info: "border-base-700 bg-base-800 text-ink-300",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    error: "border-red-500/30 bg-red-500/10 text-red-300",
  };
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm", styles[variant])} role="status">
      {children}
    </div>
  );
}
