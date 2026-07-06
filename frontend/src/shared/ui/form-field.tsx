import type { ReactNode } from "react";

type FormFieldProps = {
  children: ReactNode;
  htmlFor: string;
  label: string;
};

export const FormField = ({ children, htmlFor, label }: FormFieldProps) => (
  <div>
    <label className="mb-2 block text-base font-semibold" htmlFor={htmlFor}>
      {label}
    </label>
    {children}
  </div>
);
