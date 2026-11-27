import { Laptop, Shield, User } from "lucide-react";

export const profileMenuItems = [
  {
    label: "Профиль",
    to: "/settings/profile",
    icon: User,
  },
  {
    label: "Безопасность",
    to: "/settings/security",
    icon: Shield,
  },
  {
    label: "Сессии",
    to: "/settings/sessions",
    icon: Laptop,
  },
] as const;
