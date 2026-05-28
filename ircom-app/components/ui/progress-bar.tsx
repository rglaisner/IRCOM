export function ProgressBar({
  value,
  max,
  label,
}: Readonly<{ value: number; max: number; label: string }>) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className="space-y-1">
      <div className="ircom-secondary flex justify-between text-sm">
        <span>{label}</span>
        <span>
          {value} / {max}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-[var(--ircom-radius-pill)] bg-[var(--ircom-grey)]"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
      >
        <div
          className="h-full rounded-[var(--ircom-radius-pill)] bg-[var(--ircom-blue)] transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
