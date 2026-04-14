"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";

export type ConfirmModalProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly title?: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly variant?: "default" | "danger";
  readonly isConfirming?: boolean;
  readonly showCloseButton?: boolean;
};

/**
 * Reusable confirmation dialog. Use for destructive or sensitive actions instead of window.confirm.
 */
export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isConfirming = false,
  showCloseButton = false,
}) => {
  const handleConfirm = (): void => {
    onConfirm();
  };

   const handleDismiss = (): void => {
    if (isConfirming) {
      return;
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDismiss}
      showCloseButton={showCloseButton}
      className="mx-4 w-full max-w-md p-6 sm:p-8"
    >
      <div>
        <h2
          id="confirm-modal-title"
          className="text-lg font-semibold text-gray-800 dark:text-white/90"
        >
          {title}
        </h2>
        <p
          id="confirm-modal-description"
          className="mt-2 text-sm text-gray-600 dark:text-gray-400"
        >
          {message}
        </p>
      </div>
      <div
        className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"
        role="group"
        aria-label="Confirmation actions"
      >
        <Button
          variant="outline"
          type="button"
          onClick={handleDismiss}
          disabled={isConfirming}
          aria-label={cancelLabel}
        >
          {cancelLabel}
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          disabled={isConfirming}
          className={
            variant === "danger"
              ? "!bg-error-600 text-white shadow-theme-xs hover:!bg-error-700 disabled:!bg-error-400"
              : undefined
          }
          aria-label={confirmLabel}
        >
          {isConfirming ? "Please wait…" : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
};
