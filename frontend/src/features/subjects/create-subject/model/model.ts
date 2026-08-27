export type CreateSubjectDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const SCOPE_LABELS: Record<string, string> = {
  technology: "Технологии",
  healthcare: "Медицина",
  humanities: "Гуманитарные науки",
  business: "Бизнес",
  social: "Социальные науки",
  science: "Наука",
  other: "Другое",
};
