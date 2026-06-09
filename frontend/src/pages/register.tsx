import { useRegisterPage } from "../features/register/model/useRegisterPage.ts";

const inputClassName = [
  "h-14 w-full rounded-[8px] border-2 border-[#d9d2df] bg-[#fbfbfc]",
  "px-4 text-base font-semibold text-[#152139] outline-none transition",
  "placeholder:text-[#8c96a5] focus:border-[#7432de] focus:bg-white",
  "focus:shadow-[0_0_0_4px_rgba(116,50,222,0.12)]",
].join(" ");

export function Register() {
  const {
    createdUser,
    error,
    handleRegister,
    isSubmitting,
    password,
    setPassword,
    setUsername,
    username,
  } = useRegisterPage();

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-white
        px-5 py-10 text-[#08111f]"
    >
      <form
        onSubmit={handleRegister}
        className="w-full max-w-[420px] rounded-[8px] border-2
          border-[#7432de] bg-white p-6
          shadow-[0_22px_50px_rgba(21,18,30,0.08)] sm:p-8"
      >
        <label htmlFor="username" className="mb-3 block text-base font-bold text-[#152139]">
          Username
        </label>
        <input
          id="username"
          type="text"
          placeholder="maxla1te4"
          aria-label="username"
          value={username}
          onChange={({ target }) => setUsername(target.value)}
          className={inputClassName}
        />
        <label htmlFor="secret-code" className="mb-3 mt-5 block text-base font-bold text-[#152139]">
          Secret code
        </label>
        <input
          id="secret-code"
          name="secret code"
          type="text"
          placeholder="secret code"
          aria-label="secret code"
          value={password}
          onChange={({ target }) => setPassword(target.value)}
          className={inputClassName}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 inline-flex h-14 w-full items-center justify-center
            rounded-[8px] bg-[#6f2bd9] px-6 text-base font-bold text-white
            shadow-[0_12px_24px_rgba(111,43,217,0.22)] transition
            hover:bg-[#5c20bd] focus:outline-none focus:ring-4
            focus:ring-[#d8c8f5] disabled:cursor-not-allowed disabled:bg-[#9d86c3]"
        >
          {isSubmitting ? "registering..." : "register"}
        </button>
        {error ? <p className="mt-4 text-sm font-semibold text-[#d21f3c]">{error}</p> : null}
        {createdUser ? (
          <p className="mt-4 text-sm font-semibold text-[#247a4d]">
            Registered {createdUser.username}
          </p>
        ) : null}
      </form>
    </div>
  );
}
