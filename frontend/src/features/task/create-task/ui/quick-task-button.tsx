import { lazy, Suspense, useState } from "react";
import { Plus } from "lucide-react";
import { useCurrentUser } from "@/entities/user";
import { useGetUserSubjectsSuspense } from "@/shared/api";
import { Button } from "@/shared/ui/button";

const loadTaskDialog = () => import("./create-task-dialog");
const CreateTaskDialog = lazy(() =>
  loadTaskDialog().then((module) => ({
    default: module.CreateTaskDialog,
  })),
);

const loadingForm = (
  <span role="status" className="sr-only">
    Открываем форму
  </span>
);

function QuickTaskDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftKey: string;
}) {
  const { data: subjects } = useGetUserSubjectsSuspense();
  return <CreateTaskDialog {...props} subjects={subjects} />;
}

export function QuickTaskButton() {
  const { data: user } = useCurrentUser();
  const [open, setOpen] = useState<boolean>();

  if (!user) return null;

  return (
    <>
      <Button
        type="button"
        size="lg"
        onClick={() => {
          void loadTaskDialog().catch(() => undefined);
          setOpen(true);
        }}
      >
        <Plus aria-hidden="true" />
        Новая задача
      </Button>
      {open !== undefined && (
        <Suspense fallback={loadingForm}>
          <QuickTaskDialog
            key={user.id}
            open={open}
            onOpenChange={setOpen}
            draftKey={`studify:quick-task:v1:${user.id}`}
          />
        </Suspense>
      )}
    </>
  );
}
