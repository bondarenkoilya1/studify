type PageHeaderProps = {
  label: string;
  title: string;
  description: string;
};

export function PageHeader({ label, title, description }: PageHeaderProps) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-[var(--color-primary)]">
        {label}
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[var(--color-text)]">
        {title}
      </h1>
      <p className="mt-4 text-lg leading-8 text-[var(--color-text-muted)]">{description}</p>
    </div>
  );
}
