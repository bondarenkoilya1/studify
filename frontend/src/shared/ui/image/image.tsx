import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { imageContainerVariants, imageVariants } from "./image.variants";
import type { ImageProps, ImageSizePreset } from "./types";
import { getInitials } from "./utils";

export const Image = forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      src,
      alt = "",
      shape = "rounded",
      size = "md",
      fit = "cover",
      aspect = "auto",
      fallback,
      fallbackIcon,
      resolveUrl,
      onLoad,
      onError,
      containerClassName,
      className,
      style,
      crossOrigin,
      loading = "lazy",
      decoding = "async",
      draggable = false,
      ...props
    },
    forwardedRef,
  ) => {
    const internalImgRef = useRef<HTMLImageElement>(null);
    useImperativeHandle(forwardedRef, () => internalImgRef.current as HTMLImageElement);

    const resolvedSrc = resolveUrl && src ? resolveUrl(src) : src;

    const [status, setStatus] = useState<"idle" | "loading" | "loaded" | "error">(() =>
      resolvedSrc ? "loading" : "idle",
    );

    // Sync status if src changes during re-renders
    const [prevSrc, setPrevSrc] = useState(resolvedSrc);
    if (prevSrc !== resolvedSrc) {
      setPrevSrc(resolvedSrc);
      setStatus(resolvedSrc ? "loading" : "idle");
    }

    // Check if image is already cached by the browser
    useEffect(() => {
      if (!resolvedSrc || status !== "loading") return;

      const img = internalImgRef.current;
      if (img?.complete && img.naturalWidth > 0) {
        setStatus("loaded");
      }
    }, [resolvedSrc, status]);

    const handleLoad = () => {
      setStatus("loaded");
      onLoad?.();
    };

    const handleError = (error: unknown) => {
      setStatus("error");
      onError?.(error);
    };

    const isNumericSize = typeof size === "number";
    const sizePreset: ImageSizePreset = isNumericSize ? "custom" : (size ?? "md");

    const containerStyle: CSSProperties = {
      ...(isNumericSize ? { width: size, height: size } : {}),
      ...style,
    };

    const hasValidImage = Boolean(resolvedSrc && status !== "error");
    const isImageVisible = status === "loaded";
    const isLoading = status === "loading";

    const formattedFallback = getInitials(fallback);

    return (
      <div
        className={cn(
          imageContainerVariants({ shape, size: sizePreset, aspect }),
          containerClassName,
        )}
        style={containerStyle}
        data-status={status}
      >
        {/* Loading skeleton shimmer */}
        {isLoading && (
          <span
            className="absolute inset-0 animate-pulse bg-muted-foreground/10"
            aria-hidden="true"
          />
        )}

        {/* Underlying Image Element */}
        {hasValidImage && (
          <img
            ref={internalImgRef}
            src={resolvedSrc!}
            alt={alt}
            loading={loading}
            decoding={decoding}
            crossOrigin={crossOrigin}
            draggable={draggable}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              imageVariants({ fit }),
              isImageVisible ? "opacity-100" : "opacity-0",
              className,
            )}
            {...props}
          />
        )}

        {/* Fallback View (Error or No Source) */}
        {!hasValidImage && (
          <div
            className="flex size-full items-center justify-center p-1 text-center font-semibold leading-none select-none"
            aria-label={alt || (typeof fallback === "string" ? fallback : "Placeholder")}
          >
            {formattedFallback !== null && formattedFallback !== undefined ? (
              <span>{formattedFallback}</span>
            ) : fallbackIcon ? (
              fallbackIcon
            ) : (
              <ImageIcon className="size-1/2 shrink-0 opacity-40" aria-hidden="true" />
            )}
          </div>
        )}
      </div>
    );
  },
);

Image.displayName = "Image";
