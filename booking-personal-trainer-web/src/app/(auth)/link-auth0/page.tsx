"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Label from "@/components/form/Label";
import Input from "@/components/form/input/InputField";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import { linkAuth0ToLocal } from "@/services/auth/auth0-backend.service";
import { useToast } from "@/context/ToastContext";
import { useProfile } from "@/hooks/useProfile";
import { logout } from "@/services/auth/auth.service";
import { setAuth0SignOutPending } from "@/lib/auth0-signout-pending";
import { clearAuth0LinkingPending } from "@/lib/auth0-linking-pending";
import { clearTokens } from "@/lib/token";

export default function LinkAuth0Page() {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refetch: refetchProfile } = useProfile();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const returnTo = useMemo(() => {
    const raw = searchParams.get("returnTo");
    if (!raw) {
      return "/";
    }
    if (!raw.startsWith("/")) {
      return "/";
    }
    return raw;
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    clearAuth0LinkingPending();
    if (!returnTo) {
      return;
    }
  }, [returnTo]);

  const handleSubmit = async (): Promise<void> => {
    if (!password.trim()) {
      toast.error("Password is required");
      return;
    }
    setIsSubmitting(true);
    try {
      await linkAuth0ToLocal({ password });
      await refetchProfile();
      toast.success("Account linked successfully");
      router.replace(returnTo);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Linking failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (): Promise<void> => {
    setAuth0SignOutPending();
    try {
      await logout();
    } catch {
      clearTokens();
    }
    const returnToUrl = new URL("/", window.location.origin).toString();
    window.location.href = `/auth/logout?returnTo=${encodeURIComponent(returnToUrl)}`;
  };

  return (
    <div className="flex w-full flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Link your Auth0 login
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          This email already has an account. To link it safely, please enter your existing password.
        </p>
        <div className="mt-6 space-y-4">
          <div>
            <Label>
              Existing password <span className="text-error-500">*</span>
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            onClick={handleSubmit}
            aria-label="Link Auth0 to my account"
          >
            {isSubmitting ? "Linking..." : "Link account"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full"
            onClick={handleCancel}
            aria-label="Cancel linking"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

