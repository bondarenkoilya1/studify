import type { ComponentProps, ReactNode } from "react";
import type { VariantProps } from "class-variance-authority";
import type { imageContainerVariants, imageVariants } from "./image.variants";

export type ImageShape = "circle" | "rounded" | "square";
export type ImageFit = "cover" | "contain" | "fill" | "none";
export type ImageSizePreset = "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full" | "custom";
export type ImageSize = ImageSizePreset | number;
export type ImageAspect = "auto" | "square" | "video" | "portrait";

export interface ImageProps
  extends Omit<ComponentProps<"img">, "size" | "onError" | "onLoad" | "src">,
    Omit<VariantProps<typeof imageContainerVariants>, "size" | "shape" | "aspect">,
    Omit<VariantProps<typeof imageVariants>, "fit"> {
  src?: string | null;
  alt?: string;
  shape?: ImageShape;
  fit?: ImageFit;
  size?: ImageSize;
  aspect?: ImageAspect;
  fallback?: ReactNode;
  fallbackIcon?: ReactNode;
  resolveUrl?: (url: string) => string;
  onLoad?: () => void;
  onError?: (error?: unknown) => void;
  containerClassName?: string;
}

export interface ImageUploadProps extends Omit<ImageProps, "children" | "loading"> {
  previewUrl?: string | null;
  onFileSelect?: (file: File) => void;
  onFileReject?: (reason: string) => void;
  accept?: string;
  maxSizeBytes?: number;
  loading?: boolean;
  imageLoading?: "lazy" | "eager";
  progress?: number;
  disabled?: boolean;
  readOnly?: boolean;
  uploadIcon?: ReactNode;
  uploadText?: ReactNode;
  showOverlayOnHover?: boolean;
  clearable?: boolean;
  onClear?: () => void;
  children?: ReactNode;
}
