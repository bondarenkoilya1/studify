import { Link, NavLink } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { logoutUser } from "../../features/auth/api/logout-api.ts";
import { useAuth } from "../../features/auth/model/auth-context.tsx";
import logoStudify from "../../assets/studify/logo_studify_black_purple.png";

const navItems = [
  { label: "Subjects", to: "/subjects" },
  { label: "Tasks", to: "/tasks" },
  { label: "Dashboard", to: "/dashboard" },
];

export function SiteHeader() {
  const { clearUser, user } = useAuth();
  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSettled() {
      clearUser();
    },
  });

  return (
    <header className="border-b border-[#dfe3ea] bg-white">
      <div className="mx-auto flex h-[92px] w-full max-w-[1584px] items-center justify-between px-5 sm:px-10 lg:px-[60px]">
        <Link to="/" className="block w-[150px] shrink-0 sm:w-[178px]" aria-label="Studify home">
          <img src={logoStudify} alt="studify." className="h-auto w-full" />
        </Link>

        <nav className="hidden items-center gap-12 text-base font-medium text-black lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                [
                  "rounded-full px-4 py-2 transition",
                  isActive
                    ? "bg-[#f3edff] text-[#5d20d8]"
                    : "text-black hover:bg-[#f8f5ff] hover:text-[#5d20d8]",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {user ? (
          <div className="hidden items-center gap-4 sm:flex">
            <Link
              to="/dashboard"
              className="min-w-[120px] max-w-[220px] items-center justify-center truncate rounded-[8px] border-2 border-[#d9d2df] bg-[#fbf7fd] px-4 py-3 text-sm font-black text-[#152139] transition hover:border-[#7432de] hover:text-[#5d20d8] sm:inline-flex"
              title={user.username}
            >
              {user.username}
            </Link>
            <button
              type="button"
              disabled={logoutMutation.isPending}
              onClick={() => logoutMutation.mutate()}
              className="text-base font-bold text-black transition hover:text-[#5d20d8] disabled:cursor-not-allowed disabled:text-[#8c96a5]"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="hidden items-center gap-4 sm:flex">
            <Link to="/login" className="hidden text-base font-bold text-black sm:inline-flex">
              Sign in
            </Link>
            <Link
              to="/register"
              className="inline-flex h-12 items-center justify-center rounded-[8px] bg-[#6f2bd9] px-5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(111,43,217,0.2)] transition hover:bg-[#5c20bd] sm:px-7"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
