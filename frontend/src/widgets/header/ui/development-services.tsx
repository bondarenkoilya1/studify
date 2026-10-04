import { cn } from "@/shared/lib/cn";
import { navItems } from "../config/nav-items";
import { MailCheck, ShieldCheck } from "lucide-react";

interface Props {
  isEmailVerified: boolean;
  isTotpEnabled: boolean;
}

export function DevelopmentServices({ isEmailVerified, isTotpEnabled }: Props) {
  return (
    <nav className="flex items-center gap-1.5">
      {navItems.map((service) => {
        const Icon = service.icon;

        return (
          <a
            key={service.label}
            href={service.href}
            target="_blank"
            rel="noreferrer"
            className={cn(
              "group inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5",
              "text-[13px] font-medium text-muted-foreground",
              "transition-colors hover:bg-muted/60 hover:text-foreground",
              service.className,
            )}
          >
            <Icon className="size-3.5" strokeWidth={2} />
            <span>{service.label}</span>
          </a>
        );
      })}

      <div className="ml-1 flex h-8 items-center gap-1 rounded-lg bg-muted/50 px-1">
        <StatusItem icon={MailCheck} label="Email" active={isEmailVerified} />
        <StatusItem icon={ShieldCheck} label="2FA" active={isTotpEnabled} />
      </div>
    </nav>
  );
}

interface StatusItemProps {
  icon: typeof MailCheck;
  label: string;
  active: boolean;
}

function StatusItem({ icon: Icon, label, active }: StatusItemProps) {
  return (
    <div
      className={cn(
        "flex h-6 items-center gap-1.5 rounded-md px-2",
        "text-[11px] font-medium",
        active ? "text-foreground" : "text-muted-foreground",
      )}
      title={`${label}: ${active ? "enabled" : "disabled"}`}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          active ? "bg-emerald-500" : "bg-muted-foreground/40",
        )}
      />

      <Icon className="size-3" strokeWidth={2} />

      <span>{label}</span>
    </div>
  );
}
