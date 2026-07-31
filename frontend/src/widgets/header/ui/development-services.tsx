import { cn } from "@/shared/lib/cn";
import { navItems } from "../config/nav-items";
import { ExternalLink } from "lucide-react";

interface Props {
  isEmailVerified: boolean;
}

const linkClass = cn(
  "flex items-center gap-2 rounded-md px-3 py-1.5",
  "text-sm font-medium transition-colors",
);

export function DevelopmentServices({ isEmailVerified }: Props) {
  return (
    <nav className="flex items-center gap-2">
      {navItems.map((service) => {
        const Icon = service.icon;

        return (
          <a
            key={service.label}
            href={service.href}
            target="_blank"
            rel="noreferrer"
            className={cn(linkClass, service.className)}
          >
            <Icon className="h-4 w-4" />
            {service.label}
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </a>
        );
      })}

      <span
        className={cn(
          "rounded-md border px-3 py-1.5 text-sm font-medium",
          isEmailVerified
            ? "border-green-500/30 bg-green-500/10 text-green-400"
            : "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
        )}
      >
        {isEmailVerified ? "Verified" : "Not verified"}
      </span>
    </nav>
  );
}
