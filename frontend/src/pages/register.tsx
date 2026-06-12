import { useRegisterPage } from "../features/register/model/useRegisterPage.ts";
import { RegisterForm } from "../features/register/ui/RegisterForm.tsx";
import logoStudify from "../assets/studify/logo_studify_black_purple.png";

export function Register() {
  const {
    confirmPassword,
    createdUser,
    error,
    handleConfirmPasswordChange,
    handlePasswordChange,
    handleRegister,
    handleUsernameChange,
    isSubmitting,
    password,
    passwordLength,
    username,
  } = useRegisterPage();

  return (
    <main className="min-h-[calc(100vh-92px)] bg-[#fbf7fd] px-4 py-8 text-[#152139] sm:py-12">
      <section className="mx-auto w-full max-w-[480px]">
        <div className="mb-6 flex flex-col items-center">
          <img src={logoStudify} alt="studify." className="h-auto w-[170px]" />
          <h1 className="mt-6 text-center text-3xl font-black">Create your account</h1>
        </div>
        <RegisterForm
          confirmPassword={confirmPassword}
          createdUser={createdUser}
          error={error}
          isSubmitting={isSubmitting}
          password={password}
          passwordLength={passwordLength}
          username={username}
          onConfirmPasswordChange={handleConfirmPasswordChange}
          onPasswordChange={handlePasswordChange}
          onSubmit={handleRegister}
          onUsernameChange={handleUsernameChange}
        />
      </section>
    </main>
  );
}
