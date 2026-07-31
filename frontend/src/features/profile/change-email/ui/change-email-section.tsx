import { ChangeEmailForm } from "./change-email-form";
import { ChangeEmailHeader } from "./change-email-header";

export function ChangeEmailSection() {
  return (
    <section className="space-y-4">
      <ChangeEmailHeader />
      <ChangeEmailForm />
    </section>
  );
}
