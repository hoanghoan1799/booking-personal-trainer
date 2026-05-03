import type { ToastVariant } from "@/types/toast.types";

export type ToastVariantStyleSet = {
  readonly container: string;
  readonly iconWrap: string;
  readonly iconGlyph: string;
  readonly progressBar: string;
};

export const toastVariantStyles: Record<ToastVariant, ToastVariantStyleSet> = {
  success: {
    container:
      "border-green-400 bg-green-50 dark:border-green-600 dark:bg-gray-900",
    iconWrap: "bg-green-500 text-white",
    iconGlyph: "text-white",
    progressBar: "bg-green-500 dark:bg-green-400",
  },
  info: {
    container:
      "border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-gray-900",
    iconWrap: "bg-blue-500 text-white",
    iconGlyph: "text-white",
    progressBar: "bg-blue-500 dark:bg-blue-400",
  },
  warning: {
    container:
      "border-yellow-400 bg-yellow-50 dark:border-yellow-600 dark:bg-gray-900",
    iconWrap: "bg-yellow-500 text-white",
    iconGlyph: "text-white",
    progressBar: "bg-yellow-500 dark:bg-yellow-400",
  },
  error: {
    container:
      "border-red-400 bg-red-50 dark:border-red-600 dark:bg-gray-900",
    iconWrap: "bg-red-500 text-white",
    iconGlyph: "text-white",
    progressBar: "bg-red-500 dark:bg-red-400",
  },
};
