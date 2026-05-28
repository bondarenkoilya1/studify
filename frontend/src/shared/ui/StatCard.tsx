type StatCardProps = {
  label: string;
  value: string;
  detail: string;
  icon?: string;
  accentClassName?: string;
  iconClassName?: string;
  valueClassName?: string;
  progressValue?: number;
  progressClassName?: string;
};

export function StatCard({
  label,
  value,
  detail,
  icon,
  accentClassName = "border-[var(--color-border)] bg-[var(--color-surface)]",
  iconClassName = "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
  valueClassName = "text-[var(--color-text)]",
  progressValue,
  progressClassName = "bg-[var(--color-primary)]",
}: StatCardProps) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-[var(--shadow-card)] transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${accentClassName}`}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-[var(--color-text-muted)]">{label}</p>
        {icon ? (
          <span
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${iconClassName}`}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className={`mt-3 text-3xl font-semibold tracking-tight ${valueClassName}`}>{value}</p>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">{detail}</p>
      {typeof progressValue === "number" ? (
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
          <div
            className={`h-full rounded-full ${progressClassName}`}
            style={{ width: `${Math.min(Math.max(progressValue, 0), 100)}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
