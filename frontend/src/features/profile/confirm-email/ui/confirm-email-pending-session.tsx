export function ConfirmEmailPendingSection() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-studify-background px-4">
      <div className="w-full max-w-md rounded-[20px] border border-studify-border/70 bg-studify-surface p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto mb-6 h-14 w-14 animate-pulse rounded-full bg-studify-border/60" />

        <h1 className="mb-2 text-[22px] font-semibold tracking-tight text-studify-text">
          Подтверждаем почту
        </h1>

        <p className="text-[15px] leading-relaxed text-studify-muted">
          Это займёт всего пару секунд.
        </p>
      </div>
    </div>
  );
}
