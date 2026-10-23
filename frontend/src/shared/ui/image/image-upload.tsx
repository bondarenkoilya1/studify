import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { Camera, Loader2, UploadCloud, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Image } from "./image";
import { imageContainerVariants } from "./image.variants";
import type { ImageSizePreset, ImageUploadProps } from "./types";
import { isFileAccepted } from "./utils";

export const ImageUpload = forwardRef<HTMLDivElement, ImageUploadProps>(
  (
    {
      src,
      previewUrl,
      alt = "Изображение для загрузки",
      shape = "rounded",
      size = "md",
      fit = "cover",
      aspect = "auto",
      fallback,
      fallbackIcon,
      resolveUrl,
      containerClassName,
      className,
      style,
      accept = "image/*",
      maxSizeBytes,
      loading = false,
      imageLoading,
      progress,
      disabled = false,
      readOnly = false,
      uploadIcon,
      uploadText,
      showOverlayOnHover = true,
      clearable = false,
      onFileSelect,
      onFileReject,
      onClear,
      children,
      ...imageProps
    },
    forwardedRef,
  ) => {
    const inputId = useId();
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dragCounterRef = useRef(0);

    useImperativeHandle(forwardedRef, () => containerRef.current as HTMLDivElement);

    const [isDragging, setIsDragging] = useState(false);
    const [localPreview, setLocalPreview] = useState<string | null>(null);

    // Clean up local preview object URL to prevent memory leaks
    useEffect(() => {
      return () => {
        if (localPreview) {
          URL.revokeObjectURL(localPreview);
        }
      };
    }, [localPreview]);

    // Clear local preview if src prop is updated externally (e.g., successful server save)
    const [prevSrc, setPrevSrc] = useState(src);
    if (prevSrc !== src) {
      setPrevSrc(src);
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
        setLocalPreview(null);
      }
    }

    const effectiveSrc = previewUrl ?? localPreview ?? src;

    const handleFileValidationAndSelect = useCallback(
      (file: File) => {
        if (!isFileAccepted(file, accept)) {
          onFileReject?.("Неподдерживаемый формат файла");
          return;
        }

        if (maxSizeBytes && file.size > maxSizeBytes) {
          onFileReject?.("Размер файла превышает допустимый лимит");
          return;
        }

        // Generate instant local preview URL
        if (localPreview) {
          URL.revokeObjectURL(localPreview);
        }
        const newPreview = URL.createObjectURL(file);
        setLocalPreview(newPreview);

        onFileSelect?.(file);
      },
      [accept, maxSizeBytes, localPreview, onFileSelect, onFileReject],
    );

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileValidationAndSelect(file);
      }
      e.target.value = "";
    };

    const handleTriggerClick = (e: MouseEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled || readOnly || loading) return;
      inputRef.current?.click();
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (disabled || readOnly || loading) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        inputRef.current?.click();
      }
    };

    const handleClear = (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      if (localPreview) {
        URL.revokeObjectURL(localPreview);
        setLocalPreview(null);
      }
      onClear?.();
    };

    // Drag and Drop handlers
    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled || readOnly || loading) return;

      dragCounterRef.current += 1;
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        setIsDragging(true);
      }
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled || readOnly || loading) return;

      e.dataTransfer.dropEffect = "copy";
      if (!isDragging) setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled || readOnly || loading) return;

      dragCounterRef.current -= 1;
      if (dragCounterRef.current <= 0) {
        dragCounterRef.current = 0;
        setIsDragging(false);
      }
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);

      if (disabled || readOnly || loading) return;

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileValidationAndSelect(file);
      }
    };

    const isInteractive = !disabled && !readOnly;
    const isShowingOverlay = loading || isDragging || (showOverlayOnHover && isInteractive);

    const isNumericSize = typeof size === "number";
    const sizePreset: ImageSizePreset = isNumericSize ? "custom" : (size ?? "md");
    const containerStyle: CSSProperties = {
      ...(isNumericSize ? { width: size, height: size } : {}),
      ...style,
    };

    return (
      <div
        ref={containerRef}
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive && !loading ? 0 : undefined}
        aria-label={alt}
        aria-disabled={disabled || loading}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={handleTriggerClick}
        onKeyDown={handleKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={containerStyle}
        className={cn(
          imageContainerVariants({ shape, size: sizePreset, aspect }),
          "group transition-all duration-200 outline-none select-none",
          isInteractive &&
            !loading &&
            "cursor-pointer hover:opacity-95 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          disabled && "cursor-not-allowed opacity-60",
          readOnly && "cursor-default",
          isDragging &&
            "ring-2 ring-primary ring-offset-2 scale-[1.02] shadow-md shadow-primary/20",
          containerClassName,
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          disabled={disabled || readOnly || loading}
          className="sr-only"
          onChange={handleInputChange}
          onClick={(e) => e.stopPropagation()}
          tabIndex={-1}
        />

        {/* Base Image Display */}
        <Image
          src={effectiveSrc}
          alt={alt}
          shape={shape}
          size="full"
          fit={fit}
          fallback={fallback}
          fallbackIcon={fallbackIcon}
          resolveUrl={resolveUrl}
          loading={imageLoading}
          containerClassName="size-full bg-transparent text-inherit"
          className={className}
          {...imageProps}
        />

        {/* Custom children (e.g. badges, status dots) */}
        {children}

        {/* Upload Overlay Layer */}
        {isShowingOverlay && (
          <div
            className={cn(
              "absolute inset-0 z-10 flex flex-col items-center justify-center p-1.5 text-center text-white",
              "[&_svg]:size-[36%] [&_svg]:max-w-8 [&_svg]:max-h-8 [&_svg]:min-w-3.5 [&_svg]:min-h-3.5 [&_svg]:shrink-0",
              "transition-all duration-200",
              shape === "circle" && "rounded-full",
              shape === "rounded" && "rounded-xl",
              loading
                ? "bg-black/60 opacity-100 pointer-events-auto"
                : isDragging
                  ? "bg-black/60 opacity-100 pointer-events-none"
                  : "bg-black/45 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 pointer-events-none",
            )}
            aria-hidden="true"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin text-white" />
                {typeof progress === "number" && (
                  <span className="mt-1 text-[10px] font-semibold leading-none">
                    {Math.round(progress)}%
                  </span>
                )}
              </>
            ) : isDragging ? (
              <>
                <UploadCloud className="scale-110 text-white animate-bounce" />
                <span className="mt-1 text-[10px] font-medium leading-none">Отпустите</span>
              </>
            ) : (
              <>
                {uploadIcon ?? (
                  <Camera className="scale-90 text-white transition-transform duration-200 group-hover:scale-100" />
                )}
                {uploadText && (
                  <span className="mt-1 text-[10px] font-medium leading-none line-clamp-1">
                    {uploadText}
                  </span>
                )}
              </>
            )}
          </div>
        )}

        {/* Optional Clear Button */}
        {clearable && Boolean(effectiveSrc) && !loading && isInteractive && (
          <button
            type="button"
            onClick={handleClear}
            className={cn(
              "absolute top-1 right-1 z-20 flex size-5 items-center justify-center rounded-full bg-black/60 text-white",
              "opacity-0 transition-all duration-200 hover:bg-destructive hover:scale-110 group-hover:opacity-100",
              "focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
            title="Удалить изображение"
            aria-label="Удалить изображение"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
    );
  },
);

ImageUpload.displayName = "ImageUpload";
