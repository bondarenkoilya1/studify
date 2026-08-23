export function formatRelativeDeadline(iso: string | null) {
  if (!iso) {
    return "Без дедлайна";
  }

  const diffMs = new Date(iso).getTime() - Date.now();
  const diffH = diffMs / (1000 * 60 * 60);
  const abs = Math.abs(diffH);

  if (abs < 1) {
    const mins = Math.round(abs * 60);
    return diffMs >= 0 ? `через ${mins} мин` : `${mins} мин назад`;
  }

  if (abs < 24) {
    const hours = Math.round(abs);
    return diffMs >= 0 ? `через ${hours} ч` : `${hours} ч назад`;
  }

  const days = Math.round(abs / 24);
  return diffMs >= 0 ? `через ${days} дн` : `${days} дн назад`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}
