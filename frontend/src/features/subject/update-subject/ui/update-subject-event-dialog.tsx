import { useEffect, useState } from "react";
import { CalendarDays, X } from "lucide-react";
import type { ExamType, Subject } from "@/shared/api";
import { EXAM_TYPE_LABELS } from "@/entities/subject";
import { EXAM_TYPES } from "@/entities/subject/model/constants";
import { Button } from "@/shared/ui/button";
import { DatePicker } from "@/shared/ui/date-picker";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { useUpdateSubjectEvent } from "../model/use-update-subject-event";

export function UpdateSubjectEventDialog({
  subject,
  open,
  onOpenChange,
}: {
  subject: Subject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [examType, setExamType] = useState<ExamType>(subject.exam_type);
  const [examDate, setExamDate] = useState<Date | null>(
    subject.exam_date ? new Date(subject.exam_date) : null,
  );
  const { updateEvent, isPending } = useUpdateSubjectEvent(subject.id, () =>
    onOpenChange(false),
  );

  useEffect(() => {
    if (!open) return;
    setExamType(subject.exam_type);
    setExamDate(subject.exam_date ? new Date(subject.exam_date) : null);
  }, [open, subject.exam_type, subject.exam_date]);

  const handleSave = () => {
    updateEvent(examType, examDate);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} className="max-w-md">
      <DialogClose onClick={() => onOpenChange(false)} />
      <DialogHeader className="items-start text-left">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <CalendarDays className="size-5" />
        </div>
        <DialogTitle className="mt-2">Событие предмета</DialogTitle>
        <DialogDescription>
          Укажите тип и дату экзамена, зачёта или другого мероприятия.
        </DialogDescription>
      </DialogHeader>

      <DialogBody className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Тип события</label>
          <Select
            value={examType}
            onValueChange={(value) => setExamType(value as ExamType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue>
                {(value: string) =>
                  EXAM_TYPE_LABELS[value as ExamType] ?? value
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {EXAM_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {EXAM_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium">Дата события</label>
            {examDate && (
              <button
                type="button"
                onClick={() => setExamDate(null)}
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-destructive"
              >
                <X className="size-3" />
                Убрать дату
              </button>
            )}
          </div>
          <DatePicker
            value={examDate ?? undefined}
            onChange={(date) => setExamDate(date ?? null)}
            disablePast={false}
          />
        </div>

        <DialogFooter className="mt-0 flex-row justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button type="button" disabled={isPending} onClick={handleSave}>
            Сохранить
          </Button>
        </DialogFooter>
      </DialogBody>
    </Dialog>
  );
}
