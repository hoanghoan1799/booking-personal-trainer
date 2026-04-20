import type { ToastContent, ToastMessageInput } from "@/types/toast.types";

export const normalizeToastMessageInput = (
  input: ToastMessageInput,
): ToastContent => {
  if (typeof input === "string") {
    return { title: "", message: input };
  }
  return { title: input.title, message: input.message };
};
