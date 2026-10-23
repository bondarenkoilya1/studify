import { Settings, Shield, User } from "lucide-react";

export const profileMenuItems = [
  {
    label: "Профиль",
    to: "/settings/profile",
    icon: User,
  },
  {
    label: "Безопасности",
    to: "/settings/security",
    icon: Shield,
  },
  {
    label: "Настройки",
    to: "/settings/sessions",
    icon: Settings,
  },
] as const;
