import { type FormEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSubject,
  getSubjects,
  replaceSubject,
} from "../api/subjects-api.ts";
import { getTasks } from "../../tasks/api/tasks-api.ts";
import {
  type CreateSubjectPayload,
  type Subject,
  type UpdateSubjectPayload,
} from "../../../entities/subject/types.ts";
import { getErrorMessage } from "../../../shared/lib/errors.ts";

type SubjectUpdateContext = {
  previousSubjects?: Subject[];
};

export type SubjectFormErrors = Partial<Record<keyof CreateSubjectPayload, string>>;

const emptySubjectForm: CreateSubjectPayload = {
  name: "",
  lecturer: "",
  exam_date: "",
};

function validateSubjectForm(form: CreateSubjectPayload): SubjectFormErrors {
  return form.name.trim() ? {} : { name: "Subject name is required" };
}

export function useSubjectsPage() {
  const queryClient = useQueryClient();
  const subjectSuccessTimeouts = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const [subjectDrafts, setSubjectDrafts] = useState<Record<number, UpdateSubjectPayload>>({});
  const [subjectUpdateErrors, setSubjectUpdateErrors] = useState<Record<number, string>>({});
  const [subjectUpdateSuccesses, setSubjectUpdateSuccesses] = useState<Record<number, string>>({});
  const [pendingSubjectId, setPendingSubjectId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState<CreateSubjectPayload>(emptySubjectForm);
  const [createTouched, setCreateTouched] = useState<SubjectFormErrors>({});
  const [hasSubmittedCreate, setHasSubmittedCreate] = useState(false);

  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: getSubjects,
  });
  const tasksQuery = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasks,
  });
  const createSubjectMutation = useMutation({
    mutationFn: createSubject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subjects"] }),
  });
  const updateSubjectMutation = useMutation({
    mutationFn: ({ id, subject }: { id: number; subject: CreateSubjectPayload }) =>
      replaceSubject(id, subject),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["subjects"] });

      const previousSubjects = queryClient.getQueryData<Subject[]>(["subjects"]);
      queryClient.setQueryData<Subject[]>(["subjects"], (currentSubjects) =>
        currentSubjects?.map((subject) =>
          subject.id === variables.id ? { ...subject, ...variables.subject } : subject,
        ),
      );

      setSubjectUpdateErrors((current) => {
        const next = { ...current };
        delete next[variables.id];
        return next;
      });
      clearSubjectSuccess(variables.id);

      return { previousSubjects };
    },
    onError: (_error, variables, context: SubjectUpdateContext | undefined) => {
      if (context?.previousSubjects) {
        queryClient.setQueryData(["subjects"], context.previousSubjects);
      }

      setSubjectUpdateErrors((current) => ({
        ...current,
        [variables.id]: `Changes were not saved. ${getErrorMessage(_error)}`,
      }));
    },
    onSuccess: (updatedSubject, variables) => {
      queryClient.setQueryData<Subject[]>(["subjects"], (currentSubjects) =>
        currentSubjects?.map((subject) => (subject.id === variables.id ? updatedSubject : subject)),
      );

      setSubjectDrafts((current) => {
        const next = { ...current };
        delete next[variables.id];
        return next;
      });
      showSubjectSuccess(variables.id, "Changes saved.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });

  const subjects = subjectsQuery.data ?? [];
  const tasks = tasksQuery.data ?? [];
  const openTasks = tasks.filter((task) => task.status !== "completed");
  const nextDeadlineTask = tasks.find((task) => task.deadline);
  const createErrors = validateSubjectForm(createForm);

  useEffect(() => {
    const timeouts = subjectSuccessTimeouts.current;

    return () => {
      Object.values(timeouts).forEach(clearTimeout);
    };
  }, []);

  function clearSubjectSuccess(id: number) {
    const timeout = subjectSuccessTimeouts.current[id];
    if (timeout) {
      clearTimeout(timeout);
      delete subjectSuccessTimeouts.current[id];
    }

    setSubjectUpdateSuccesses((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function showSubjectSuccess(id: number, message: string) {
    clearSubjectSuccess(id);
    setSubjectUpdateSuccesses((current) => ({
      ...current,
      [id]: message,
    }));
    subjectSuccessTimeouts.current[id] = setTimeout(() => {
      clearSubjectSuccess(id);
    }, 1800);
  }

  function updateSubjectDraft(id: number, field: keyof UpdateSubjectPayload, value: string) {
    setSubjectUpdateErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    clearSubjectSuccess(id);
    setSubjectDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value,
      },
    }));
  }

  async function handleCreateSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasSubmittedCreate(true);

    if (Object.keys(createErrors).length > 0) {
      return;
    }

    await createSubjectMutation.mutateAsync({
      name: createForm.name.trim(),
      lecturer: createForm.lecturer.trim(),
      exam_date: createForm.exam_date.trim(),
    });
    setCreateForm(emptySubjectForm);
    setCreateTouched({});
    setHasSubmittedCreate(false);
  }

  async function handleUpdateSubject(
    event: FormEvent<HTMLFormElement>,
    id: number,
    currentSubject: CreateSubjectPayload,
  ) {
    event.preventDefault();

    const draft = subjectDrafts[id];
    if (!draft) {
      return;
    }

    setPendingSubjectId(id);
    setSubjectUpdateErrors((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    clearSubjectSuccess(id);

    const nextSubject: CreateSubjectPayload = {
      ...currentSubject,
      ...draft,
    };
    const changedFields = Object.entries(draft).filter(([field, value]) => {
      return value !== currentSubject[field as keyof CreateSubjectPayload];
    });

    if (changedFields.length === 0) {
      setSubjectDrafts((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setPendingSubjectId(null);
      return;
    }

    try {
      await updateSubjectMutation.mutateAsync({ id, subject: nextSubject });
    } catch {
      // Rollback and card-level messaging are handled by the mutation callbacks.
    } finally {
      setPendingSubjectId(null);
    }
  }

  return {
    createErrors,
    createForm,
    createSubjectMutation,
    createTouched,
    handleCreateSubject,
    handleUpdateSubject,
    hasSubmittedCreate,
    nextDeadlineTask,
    openTasks,
    pendingSubjectId,
    setCreateForm,
    setCreateTouched,
    subjectDrafts,
    subjectUpdateErrors,
    subjectUpdateSuccesses,
    subjects,
    subjectsQuery,
    tasks,
    tasksQuery,
    updateSubjectDraft,
  };
}
