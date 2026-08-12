import { ShieldCheck } from "lucide-react";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { CopyButton } from "@/shared/ui/copy-button";

type RecoveryCodesDialogProps = {
  open: boolean;
  codes: string[];
  onOpenChange: (open: boolean) => void;
};

export function RecoveryCodesDialog({
  open,
  codes,
  onOpenChange,
}: RecoveryCodesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogClose onClick={() => onOpenChange(false)} />

      <DialogHeader>
        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10">
          <ShieldCheck className="size-7 text-emerald-600" strokeWidth={2} />
        </div>

        <DialogTitle>Save your recovery codes</DialogTitle>

        <DialogDescription>
          Two-factor authentication is now on. Store these codes somewhere safe
          — each one works only once if you ever lose access to your
          authenticator.
        </DialogDescription>
      </DialogHeader>

      <DialogBody>
        <div className="grid grid-cols-2 gap-2">
          {codes.map((code) => (
            <div
              key={code}
              className="flex items-center justify-between gap-2 rounded-xl bg-muted/60 px-2.5 py-2.5"
            >
              <code className="whitespace-nowrap font-mono text-[12.5px] font-medium tracking-tight text-foreground">
                {code}
              </code>
              <CopyButton value={code} />
            </div>
          ))}
        </div>
      </DialogBody>

      <DialogFooter>
        <Button
          type="button"
          className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90"
          onClick={() => onOpenChange(false)}
        >
          Done
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
