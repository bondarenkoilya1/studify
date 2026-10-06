import { useDisableTotp } from "../model/use-disable-totp";

export function DisableTotpButton() {
  const { mutate, isPending } = useDisableTotp();

  return (
    <button
      type="button"
      className="
        inline-flex items-center justify-center
        rounded-lg border border-red-500/20
        bg-red-500/5 px-4 py-2
        text-sm font-medium text-red-500
        transition-colors
        hover:border-red-500/30
        hover:bg-red-500/10
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-red-500/30
        disabled:pointer-events-none
        disabled:opacity-50
      "
      disabled={isPending}
      onClick={() => mutate()}
    >
      Disable 2FA
    </button>
  );
}
