export function ConfirmEmailPendingSection() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md form-surface text-center">
        <div className="mx-auto mb-6 h-14 w-14 animate-pulse rounded-full bg-muted" />

        <h1 className="mb-2 text-[22px] font-semibold tracking-tight text-foreground">
          Подтверждаем почту
        </h1>

        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Это займёт всего пару секунд.
        </p>
      </div>
    </div>
  );
}
