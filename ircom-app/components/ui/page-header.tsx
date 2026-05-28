export function PageHeader({
  title,
  description,
}: Readonly<{ title: string; description?: string }>) {
  return (
    <header className="space-y-2">
      <h2 className="ircom-heading text-xl font-semibold sm:text-2xl">{title}</h2>
      {description ? (
        <p className="ircom-secondary text-sm leading-relaxed">{description}</p>
      ) : null}
    </header>
  );
}
