import { useId, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { toAbsoluteUrl } from "@/shared/utils";

interface AvatarProps {
  email: string;
  avatarUrl?: string | null;
  size: number;
  className?: string;
  accept?: string;
  disabled?: boolean;
  onFileSelect?: (file: File) => void;
  loading?: boolean;
}

const APPLE_EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

export function Avatar({
  email,
  avatarUrl,
  size,
  className,
  accept = "image/*",
  disabled = false,
  onFileSelect,
  loading = false,
}: AvatarProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasImageError, setHasImageError] = useState(false);

  const [prevAvatarUrl, setPrevAvatarUrl] = useState(avatarUrl);
  if (prevAvatarUrl !== avatarUrl) {
    setPrevAvatarUrl(avatarUrl);
    setHasImageError(false);
  }

  const src = useMemo(() => {
    if (!avatarUrl || hasImageError) {
      return null;
    }
    return toAbsoluteUrl(avatarUrl);
  }, [avatarUrl, hasImageError]);

  const initials = email.slice(0, 2).toUpperCase();
  const iconSize = Math.max(14, Math.round(size * 0.3));

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
    }
    e.target.value = "";
  };

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "group relative flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full",
        "bg-linear-to-br from-zinc-700 via-zinc-900 to-black text-white",
        "transition-transform duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "hover:scale-[1.03] active:scale-[0.97]",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className,
      )}
      style={{
        width: size,
        height: size,
        transitionTimingFunction: APPLE_EASE,
      }}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        disabled={disabled || loading}
        className="sr-only"
        onChange={handleFileChange}
      />

      {src ? (
        <img
          src={src}
          alt={email}
          className="h-full w-full object-cover"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <span className="text-xs font-semibold">{initials}</span>
      )}

      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-black/0",
          "opacity-0 transition-all duration-200 group-hover:bg-black/40 group-hover:opacity-100",
          loading && "bg-black/40 opacity-100",
        )}
        style={{ transitionTimingFunction: APPLE_EASE }}
        aria-hidden="true"
      >
        {loading ? (
          <Loader2
            size={iconSize}
            strokeWidth={1.75}
            className="animate-spin text-white"
          />
        ) : (
          <Camera
            size={iconSize}
            strokeWidth={1.75}
            className="scale-90 text-white transition-transform duration-200 group-hover:scale-100"
          />
        )}
      </div>
    </label>
  );
}
