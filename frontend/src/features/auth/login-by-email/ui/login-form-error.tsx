type LoginFormErrorProps = {
  message?: string;
};

export function LoginFormError({ message }: LoginFormErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
      {message}
    </div>
  );
}
