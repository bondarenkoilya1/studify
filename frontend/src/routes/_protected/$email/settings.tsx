import { createFileRoute, Link } from "@tanstack/react-router";
import { User, Settings, Shield, Bell } from "lucide-react";

export const Route = createFileRoute("/_protected/$email/settings")({
  component: RouteComponent,
});

function RouteComponent() {
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
                @{email.toLowerCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Табы навигации */}
        <div className="mt-8 flex border-b border-border/60">
          <Link
            to="/$email"
            params={{ email }}
            className="flex items-center gap-2 border-b-2 border-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <User className="h-4 w-4" />
            Профиль
          </Link>
          <Link
            to="/$email/settings"
            params={{ email }}
            className="flex items-center gap-2 border-b-2 border-primary px-4 py-2.5 text-sm font-medium text-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
            Настройки
          </Link>
        </div>
      </div>

      {/* Контент настроек с жесткой сеткой */}
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Боковое подменю настроек (Фиксированная ширина w-48) */}
        <div className="flex flex-row gap-1 w-full md:w-48 md:flex-col shrink-0">
          <button className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm font-medium text-foreground w-full text-left">
            <User className="h-4 w-4" />
            Аккаунт
          </button>
          <button className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground w-full text-left transition-colors">
            <Shield className="h-4 w-4" />
            Приватность
          </button>
          <button className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 hover:text-foreground w-full text-left transition-colors">
            <Bell className="h-4 w-4" />
            Уведомления
          </button>
        </div>

        {/* Форма настроек */}
        <div className="w-full flex-1 rounded-2xl border bg-card p-6 shadow-xs space-y-6 min-w-0">
          <div>
            <h3 className="text-lg font-medium tracking-tight">
              Настройки аккаунта
            </h3>
            <p className="text-sm text-muted-foreground">
              Измените публичную информацию вашего профиля.
            </p>
          </div>

          <div className="border-t border-border/60 my-4" />

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium tracking-wide">
                Почтовый адрес
              </label>
              <input
                type="text"
                defaultValue={email}
                className="w-full h-10 rounded-xl border bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium tracking-wide">
                О себе
              </label>
              <textarea
                rows={4}
                placeholder="Расскажите немного о себе..."
                className="w-full rounded-xl border bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button className="h-9 px-4 rounded-xl border bg-background text-sm font-medium shadow-xs hover:bg-muted transition-colors">
              Отмена
            </button>
            <button className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium shadow-xs hover:bg-primary/90 transition-colors">
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
