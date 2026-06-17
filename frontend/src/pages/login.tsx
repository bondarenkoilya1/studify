import { useLoginPage } from "../features/login/model/useLoginPage.ts";
import { LoginForm } from "../features/login/ui/LoginForm.tsx";
import logoStudify from "../assets/studify/logo_studify_black_purple.png";

export function Login() {
  const {
    error,
    handleLogin,
    handlePasswordChange,
    handleUsernameChange,
    isSubmitting,
    password,
    username,
  } = useLoginPage();

  return (
    <main className="min-h-[calc(100vh-92px)] bg-[#fbf7fd] px-4 py-8 text-[#152139] sm:py-12">
      <section className="mx-auto w-full max-w-[440px]">
        <div className="mb-6 flex flex-col items-center">
          <img src={logoStudify} alt="studify." className="h-auto w-[170px]" />
          <h1 className="mt-6 text-center text-3xl font-black">Sign in</h1>
        </div>
        <LoginForm
          error={error}
          isSubmitting={isSubmitting}
          password={password}
          username={username}
          onPasswordChange={handlePasswordChange}
          onSubmit={handleLogin}
          onUsernameChange={handleUsernameChange}
        />
      </section>
    </main>
  );
}
