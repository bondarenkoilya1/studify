import { FormError } from "@/shared/ui/form-field";

export function LoginFormError({ message }: { message?: string }) {
  return (
    <FormError variant="summary" className="mb-5">
      {message}
    </FormError>
  );
}
