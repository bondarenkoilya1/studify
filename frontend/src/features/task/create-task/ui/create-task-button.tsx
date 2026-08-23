import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/ui/button";

import { CreateTaskDialog } from "./create-task-dialog";

type CreateTaskButtonProps = {
  subjectId: number;
};

export function CreateTaskButton({ subjectId }: CreateTaskButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Новая задача
      </Button>

      <CreateTaskDialog
        open={open}
        onOpenChange={setOpen}
        subjectId={subjectId}
      />
    </>
  );
}
