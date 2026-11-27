import { lazy, Suspense, useState } from "react";
import { Plus } from "lucide-react";
import { useCurrentUser } from "@/entities/user";
import type { Subject } from "@/shared/api";
import { Button } from "@/shared/ui/button";

const CreateTaskDialog = lazy(() =>
  import("./create-task-dialog").then((module) => ({
    default: module.CreateTaskDialog,
  })),
);

const loadingForm = (
  <span role="status" className="sr-only">
    Открываем форму
  </span>
);

export function QuickTaskButton({ subjects }: { subjects: Subject[] }) {
  const { data: user } = useCurrentUser();
  const [open, setOpen] = useState<boolean>();

  if (!user) return null;

  return (
    <>
      <Button type="button" size="lg" onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        Новая задача
      </Button>
      {open !== undefined && (
        <Suspense fallback={loadingForm}>
          <CreateTaskDialog
            key={user.id}
            open={open}
            onOpenChange={setOpen}
            subjects={subjects}
            draftKey={`studify:quick-task:v1:${user.id}`}
          />
        </Suspense>
      )}
    </>
  );
}
