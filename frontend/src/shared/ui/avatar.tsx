import { useMemo, useState } from "react";
import { publicEnv } from "@/shared/config";
import { cn } from "@/shared/lib/cn";

interface AvatarProps {
  email: string;
  avatarUrl?: string | null;
  size: number;
  className?: string;
}

function toAbsoluteAvatarUrl(avatarUrl: string): string {
  if (/^https?:\/\//i.test(avatarUrl)) {
    return avatarUrl;
  }

  const normalizedPath = avatarUrl.startsWith("/") ? avatarUrl : `/${avatarUrl}`;

  return `${publicEnv.apiBaseUrl}${normalizedPath}`;
}

export function Avatar({ email, avatarUrl, size, className }: AvatarProps) {
  const [hasImageError, setHasImageError] = useState(false);

  const src = useMemo(() => {
    if (!avatarUrl || hasImageError) {
      return null;
    }

    return toAbsoluteAvatarUrl(avatarUrl);
  }, [avatarUrl, hasImageError]);

  return (
    <div
      className={cn(
        "relative shrink-0 select-none overflow-hidden rounded-full border border-white/10",
        "bg-linear-to-br from-zinc-700 via-zinc-900 to-black text-white shadow-inner",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <img
          src={src}
          alt={email}
          className="h-full w-full object-cover"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <>
          <div className="absolute -inset-4 bg-white/5 blur-xl" />
          <div className="relative flex h-full w-full items-center justify-center text-xs font-semibold">
            {email.substring(0, 2).toUpperCase()}
          </div>
        </>
      )}
    </div>
  );
}
