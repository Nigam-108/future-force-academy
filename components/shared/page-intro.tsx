export function PageIntro({
  eyebrow,
  title,
  description
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8">
      {eyebrow ? (
        <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {eyebrow}
        </span>
      ) : null}
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
      {description ? <p className="mt-2 text-slate-600">{description}</p> : null}
    </div>
  );
}
