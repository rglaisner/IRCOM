export function EmptyState({
  title,
  description,
}: Readonly<{ title: string; description: string }>) {
  return (
    <div
      className="ircom-panel-subtle rounded-[var(--ircom-radius-md)] border border-dashed border-[var(--ircom-border)] p-6 text-center"
      data-testid="empty-state"
    >
      <p className="ircom-heading font-medium">{title}</p>
      <p className="ircom-secondary mt-2 text-sm">{description}</p>
    </div>
  );
}
