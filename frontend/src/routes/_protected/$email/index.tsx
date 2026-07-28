import { createFileRoute, Link } from "@tanstack/react-router";
import { User, Settings } from "lucide-react";

export const Route = createFileRoute("/_protected/$email/")({
  component: ProfilePage,
});

function ProfilePage() {
  const { email } = Route.useParams();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Шапка профиля */}
      <div className="relative overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-xs p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            {/* Аватарка */}
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border bg-muted font-medium text-muted-foreground shadow-inner text-3xl select-none">
              {email.substring(0, 2).toUpperCase()}
            </div>

            {/* Инфо */}
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">{email}</h1>
              <p className="text-sm font-medium text-muted-foreground">
                @{email.split("@")[0]}
              </p>
            </div>
          </div>

          {/* Кнопка настроек */}
          <Link
            to="/$email/settings"
            params={{ email }}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border bg-background px-4 text-sm font-medium shadow-xs transition-colors hover:bg-muted focus-visible:outline-hidden"
          >
            <Settings className="h-4 w-4" />
            Редактировать
          </Link>
        </div>

        {/* Табы навигации */}
        <div className="mt-8 flex border-b border-border/60">
          <Link
            to="/$email"
            params={{ email }}
            className="flex items-center gap-2 border-b-2 border-primary px-4 py-2.5 text-sm font-medium text-foreground transition-colors"
          >
            <User className="h-4 w-4" />
            Профиль
          </Link>
          <Link
            to="/$email/settings"
            params={{ email }}
            className="flex items-center gap-2 border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            Настройки
          </Link>
        </div>
      </div>

      {/* Контент страницы с жесткой сеткой */}
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Невидимый блок такой же ширины, как и меню в настройках */}
        <div className="hidden md:block w-full md:w-48 shrink-0" />

        {/* Основной блок контента профиля */}
        <div className="w-full flex-1 rounded-2xl border bg-card p-6 shadow-xs min-w-0">
          <h2 className="text-xl font-semibold tracking-tight mb-3">О себе</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Основной контент профиля пользователя. Здесь можно разместить личную
            информацию, био или кастомные виджеты.
          </p>
        </div>
      </div>
    </div>
  );
}
