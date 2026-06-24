import { type FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSubjects } from "../../subjects/api/subjects-api.ts";
import { createTask, getTasks, updateTask } from "../api/tasks-api.ts";
import { type Task, type TaskStatus } from "../../../entities/task/types.ts";
import { type Subject } from "../../../entities/subject/types.ts";
import { getErrorMessage } from "../../../shared/lib/errors.ts";
import { dateInputToDate } from "../../../shared/lib/dateFormat.ts";

export const taskStatusOptions: TaskStatus[] = ["not_completed", "ongoing", "completed"];

type StatusUpdateContext = {
  previousTasks?: Task[];
};

export type TaskFormState = {
  name: string;
  description: string;
  subject_id: number;
  deadline: string;
  status: TaskStatus;
};

export type TaskFormErrors = Partial<Record<keyof TaskFormState, string>>;

const emptyTaskForm: TaskFormState = {
  name: "",
  description: "",
  subject_id: 0,
  deadline: "",
  status: "not_completed",
};
const emptySubjects: Subject[] = [];
const emptyTasks: Task[] = [];

function validateTaskForm(form: TaskFormState, hasSubjects: boolean): TaskFormErrors {
  const errors: TaskFormErrors = {};
  if (!form.name.trim()) {
    errors.name = "Task name is required";
  }
  if (!hasSubjects || form.subject_id <= 0) {
    errors.subject_id = "Create a subject before adding tasks.";
  }
  if (!form.deadline) {
    errors.deadline = "Deadline is required";
  }
  return errors;
}

export function asTaskStatus(status: Task["status"]): TaskStatus {
  return taskStatusOptions.includes(status as TaskStatus)
    ? (status as TaskStatus)
    : "not_completed";
}

export function useTasksPage() {
  const queryClient = useQueryClient();
  const [statusUpdateErrors, setStatusUpdateErrors] = useState<Record<number, string>>({});
  const [pendingStatusTaskId, setPendingStatusTaskId] = useState<number | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormState>(emptyTaskForm);
  const [touchedFields, setTouchedFields] = useState<TaskFormErrors>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: getSubjects,
  });
  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
  });
  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) => updateTask(id, { status }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);
      queryClient.setQueryData<Task[]>(["tasks"], (currentTasks) =>
        currentTasks?.map((task) =>
          task.id === variables.id ? { ...task, status: variables.status } : task,
        ),
      );

      setStatusUpdateErrors((current) => {
        const next = { ...current };
        delete next[variables.id];
        return next;
      });

      return { previousTasks };
    },
    onError: (_error, variables, context: StatusUpdateContext | undefined) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }

      setStatusUpdateErrors((current) => ({
        ...current,
        [variables.id]: `Status was not saved. ${getErrorMessage(_error)}`,
      }));
    },
    onSuccess: (updatedTask, variables) => {
      queryClient.setQueryData<Task[]>(["tasks"], (currentTasks) =>
        currentTasks?.map((task) => (task.id === variables.id ? updatedTask : task)),
      );

      setStatusUpdateErrors((current) => {
        const next = { ...current };
        delete next[variables.id];
        return next;
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const subjects = subjectsQuery.data ?? emptySubjects;
  const tasks = tasksQuery.data ?? emptyTasks;
  const subjectNames = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject.name])),
    [subjects],
  );
  const selectedSubjectId = taskForm.subject_id || subjects[0]?.id || 0;
  const formWithSelectedSubject = { ...taskForm, subject_id: selectedSubjectId };
  const formErrors = validateTaskForm(formWithSelectedSubject, subjects.length > 0);
  const openTasks = tasks.filter((task) => task.status !== "completed");
  const ongoingTasks = tasks.filter((task) => task.status === "ongoing");
  const completedTasks = tasks.filter((task) => task.status === "completed");

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasSubmitted(true);

    if (Object.keys(formErrors).length > 0) {
      return;
    }

    await createTaskMutation.mutateAsync({
      name: taskForm.name.trim(),
      description: taskForm.description.trim(),
      subject_id: selectedSubjectId,
      deadline: dateInputToDate(taskForm.deadline),
      status: taskForm.status,
    });

    setTaskForm({
      ...emptyTaskForm,
      subject_id: selectedSubjectId,
    });
    setTouchedFields({});
    setHasSubmitted(false);
  }

  async function handleStatusChange(id: number, status: TaskStatus) {
    setPendingStatusTaskId(id);

    try {
      await updateTaskMutation.mutateAsync({ id, status });
    } catch {
      // Rollback and row-level messaging are handled by the mutation callbacks.
    } finally {
      setPendingStatusTaskId(null);
    }
  }

  return {
    completedTasks,
    createTaskMutation,
    formErrors,
    handleCreateTask,
    handleStatusChange,
    hasSubmitted,
    ongoingTasks,
    openTasks,
    pendingStatusTaskId,
    selectedSubjectId,
    setTaskForm,
    setTouchedFields,
    statusUpdateErrors,
    subjectNames,
    subjects,
    subjectsQuery,
    taskForm,
    tasks,
    tasksQuery,
    touchedFields,
  };
}
