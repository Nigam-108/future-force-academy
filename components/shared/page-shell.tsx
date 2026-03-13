import { cn } from "@/lib/utils";

export function PageShell({
  title,
  description,
  children,
  className
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8", className)}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description ? <p className="mt-2 text-slate-600">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}