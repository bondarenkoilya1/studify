import { createFileRoute } from "@tanstack/react-router";
import { CreateSubjectSection } from "@/features/subject/create-subject";

export const Route = createFileRoute("/_protected/subjects")({
  component: CreateSubjectSection,
});
