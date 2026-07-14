import Link from "next/link";
import { CenteredPage } from "@/shared/ui/centered-page";
import { getMe } from "@/shared/api/server";

export default async function Home() {
  const user = await getMe();

  console.table(user);

  return (
    <CenteredPage>
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Studify</h1>

          <p className="mt-2 text-sm text-neutral-500">
            Организуйте обучение, задачи и дедлайны в одном месте.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Link
            href="/login"
            className="flex h-12 items-center justify-center rounded-xl bg-black font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Войти
          </Link>

          <Link
            href="/register"
            className="flex h-12 items-center justify-center rounded-xl border border-neutral-300 bg-white font-medium text-neutral-900 transition-colors hover:bg-neutral-100"
          >
            Зарегистрироваться
          </Link>
        </div>
      </div>
    </CenteredPage>
  );
}
