import { Shield, User } from "lucide-react";

export const profileMenuItems = [
  {
    label: "Profile",
    to: "/settings/profile",
    icon: User,
  },
  {
    label: "Security",
    to: "/settings/security",
    icon: Shield,
  },
] as const;
