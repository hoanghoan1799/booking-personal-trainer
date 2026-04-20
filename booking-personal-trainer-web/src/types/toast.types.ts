export type ToastVariant = "success" | "error" | "warning" | "info";

export type ToastContent = {
  readonly title: string;
  readonly message: string;
};

export type ToastRecord = ToastContent & {
  readonly id: string;
  readonly variant: ToastVariant;
  readonly durationMs: number;
};

export type ShowToastInput = ToastContent & {
  readonly variant: ToastVariant;
  readonly durationMs?: number;
};

/** Call sites may pass a legacy string (message only) or structured title + message. */
export type ToastMessageInput = string | ToastContent;

export type ToastActions = {
  readonly show: (input: ShowToastInput) => void;
  readonly success: (input: ToastMessageInput, durationMs?: number) => void;
  readonly error: (input: ToastMessageInput, durationMs?: number) => void;
  readonly warning: (input: ToastMessageInput, durationMs?: number) => void;
  readonly info: (input: ToastMessageInput, durationMs?: number) => void;
  readonly dismiss: (toastId: string) => void;
};

export type ToastContextValue = {
  readonly toast: ToastActions;
};
