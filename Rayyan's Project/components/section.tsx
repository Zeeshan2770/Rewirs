import { cn } from "@/lib/utils";

export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("mx-auto max-w-6xl px-6 py-16 sm:py-20", className)}>
      {children}
    </section>
  );
}

export function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-xl">
      <h2 className="font-display text-3xl leading-tight text-ink-100 sm:text-4xl">{title}</h2>
      {description && <p className="mt-3 text-ink-500">{description}</p>}
    </div>
  );
}
