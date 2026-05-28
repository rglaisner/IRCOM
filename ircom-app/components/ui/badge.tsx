export function Badge({
  children,
  color = "var(--ircom-blue)",
}: Readonly<{ children: React.ReactNode; color?: string }>) {
  return (
    <span
      className="inline-flex items-center rounded-[var(--ircom-radius-pill)] px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {children}
    </span>
  );
}
