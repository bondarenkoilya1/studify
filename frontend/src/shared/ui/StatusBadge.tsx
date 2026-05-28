import { getStatusClass, getStatusLabel } from "../lib/taskStatus.ts";

type StatusBadgeProps = {
  status: string;
  tone?: "default" | "overdue";
};

export function StatusBadge({ status, tone = "default" }: StatusBadgeProps) {
  const className =
    tone === "overdue"
      ? "bg-red-100 text-red-700 ring-red-200"
      : `${getStatusClass(status)} ring-[var(--color-border)]`;

  return (
    <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${className}`}>
      {getStatusLabel(status)}
    </span>
  );
}
