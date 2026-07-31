import { FileCode2, type LucideIcon, Mail } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  className: string;
}

export const navItems: NavItem[] = [
  {
    label: "Swagger",
    href: "http://localhost:8081",
    icon: FileCode2,
    className:
      "border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20",
  },
  {
    label: "Mailpit",
    href: "http://localhost:8025",
    icon: Mail,
    className:
      "border border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20",
  },
];
