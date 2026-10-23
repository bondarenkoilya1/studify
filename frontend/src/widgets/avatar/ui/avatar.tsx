import { Image, type ImageProps } from "@/shared/ui/image";
import { toAbsoluteUrl } from "@/shared/utils";
import { cn } from "@/shared/lib/cn";

export interface AvatarProps extends Omit<ImageProps, "fallback" | "src"> {
  email: string;
  avatarUrl?: string | null;
  size?: number | ImageProps["size"];
}

export function Avatar({
  email,
  avatarUrl,
  size = 32,
  className,
  containerClassName,
  ...props
}: AvatarProps) {
  return (
    <Image
      src={avatarUrl}
      resolveUrl={toAbsoluteUrl}
      fallback={email}
      shape="circle"
      size={size}
      alt={email}
      containerClassName={cn(
        "bg-transparent border border-border/60 text-foreground font-semibold",
        containerClassName,
      )}
      className={className}
      {...props}
    />
  );
}
