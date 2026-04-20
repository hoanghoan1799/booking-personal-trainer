"use client";

import { useState } from "react";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { useToast } from "@/context/ToastContext";
import type { User } from "@/types/user.types";
import { setPassword } from "@/services/auth/auth.service";

type UserPasswordCardProps = {
  readonly user: User;
  readonly onPasswordCreated: () => void;
};

export default function UserPasswordCard(props: UserPasswordCardProps) {
  const toast = useToast();
  const [password, setPasswordValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasPassword = Boolean(props.user.hasPassword);
  if (hasPassword) {
    return null;
  }

  const handleCreatePassword = async (): Promise<void> => {
    if (!password.trim()) {
      toast.error("Password is required");
      return;
    }
    setIsSubmitting(true);
    try {
      await setPassword({ newPassword: password });
      toast.success("Password created successfully");
      props.onPasswordCreated();
      setPasswordValue("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create password";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
        Create a password
      </h4>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Add a password so you can sign in with email/password in addition to Auth0.
      </p>
      <div className="mt-4 space-y-4">
        <div>
          <Label>
            New password <span className="text-error-500">*</span>
          </Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter a new password"
              value={password}
              onChange={(e) => setPasswordValue(e.target.value)}
            />
            <span
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
              role="button"
              tabIndex={0}
              aria-label={showPassword ? "Hide password" : "Show password"}
              onKeyDown={(e) => e.key === "Enter" && setShowPassword((prev) => !prev)}
            >
              {showPassword ? (
                <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
              ) : (
                <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
              )}
            </span>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          className="w-full"
          disabled={isSubmitting}
          onClick={handleCreatePassword}
          aria-label="Create password"
        >
          {isSubmitting ? "Saving..." : "Create password"}
        </Button>
      </div>
    </div>
  );
}

