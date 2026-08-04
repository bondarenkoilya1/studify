import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected/subjects/$id")({
  component: SubjectPage,
});

function SubjectPage() {
  const { id } = Route.useParams();

  return (
    <div>
      <h1>Subject {id}</h1>
    </div>
  );
}
