import { cva } from "class-variance-authority";

export const imageContainerVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-muted text-muted-foreground select-none",
  {
    variants: {
      shape: {
        circle: "rounded-full",
        rounded: "rounded-xl",
        square: "rounded-none",
      },
      size: {
        xs: "size-6 text-[10px]",
        sm: "size-8 text-xs",
        md: "size-10 text-sm",
        lg: "size-12 text-base",
        xl: "size-16 text-lg",
        "2xl": "size-24 text-2xl",
        full: "size-full",
        custom: "",
      },
      aspect: {
        auto: "",
        square: "aspect-square",
        video: "aspect-video",
        portrait: "aspect-[3/4]",
      },
    },
    defaultVariants: {
      shape: "rounded",
      size: "md",
      aspect: "auto",
    },
  },
);

export const imageVariants = cva("size-full transition-opacity duration-300", {
  variants: {
    fit: {
      cover: "object-cover",
      contain: "object-contain",
      fill: "object-fill",
      none: "object-none",
    },
  },
  defaultVariants: {
    fit: "cover",
  },
});
