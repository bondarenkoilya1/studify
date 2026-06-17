import { type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";

type LoginFormProps = {
  error: string;
  isSubmitting: boolean;
  password: string;
  username: string;
  onPasswordChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUsernameChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

const inputClassName = [
  "h-12 w-full rounded-[8px] border-2 border-[#d9d2df] bg-white",
  "px-4 text-base font-semibold text-[#152139] outline-none transition",
  "placeholder:text-[#8c96a5] focus:border-[#7432de]",
  "focus:shadow-[0_0_0_4px_rgba(116,50,222,0.12)]",
].join(" ");

const fieldLabelClassName = "mb-2 block text-sm font-bold text-[#152139]";

export function LoginForm({
  error,
  isSubmitting,
  onPasswordChange,
  onSubmit,
  onUsernameChange,
  password,
  username,
}: LoginFormProps) {
  return (
    <div className="w-full">
      <form
        onSubmit={onSubmit}
        className="rounded-[8px] border-2 border-[#7432de] bg-white p-6 shadow-[0_18px_40px_rgba(21,18,30,0.08)]"
      >
        <LoginTextField
          id="login-username"
          label="Username"
          name="username"
          autoComplete="username"
          placeholder="maxonchik_ok4"
          value={username}
          onChange={onUsernameChange}
        />

        <LoginTextField
          id="login-password"
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="enter password"
          value={password}
          onChange={onPasswordChange}
          className="mt-4"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-[8px] bg-[#6f2bd9] px-5 text-base font-black text-white shadow-[0_12px_24px_rgba(111,43,217,0.22)] transition hover:bg-[#5c20bd] focus:outline-none focus:ring-4 focus:ring-[#d8c8f5] disabled:cursor-not-allowed disabled:bg-[#9d86c3]"
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>

        {error ? <LoginError message={error} /> : null}
      </form>
      <p className="mt-4 rounded-[8px] border border-[#d9d2df] bg-white px-4 py-4 text-center text-sm font-semibold text-[#4b5566]">
        New to Studify?{" "}
        <Link to="/register" className="font-bold text-[#6f2bd9] hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
}

function LoginTextField({
  autoComplete,
  className = "",
  id,
  label,
  name,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  autoComplete: string;
  className?: string;
  id: string;
  label: string;
  name: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  type?: "password" | "text";
  value: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={fieldLabelClassName}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-label={label.toLowerCase()}
        value={value}
        onChange={onChange}
        className={inputClassName}
      />
    </div>
  );
}

function LoginError({ message }: { message: string }) {
  return (
    <p className="mt-4 rounded-[8px] border border-[#ffd1d8] bg-[#fff3f5] px-4 py-3 text-sm font-bold text-[#d21f3c]">
      {message}
    </p>
  );
}
