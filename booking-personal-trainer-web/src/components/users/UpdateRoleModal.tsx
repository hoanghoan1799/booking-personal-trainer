"use client";

import { useState, useEffect } from "react";
import type { User } from "@/types/user.types";
import type { UserRole } from "@/services/users/users.service";
import { updateUserRole } from "@/services/users/users.service";
import { getErrorMessage } from "@/lib/error.utils";
import { useToast } from "@/context/ToastContext";
import { Modal } from "@/components/ui/modal";
import Button from "@/components/ui/button/Button";

const ROLES: UserRole[] = ["ADMIN", "TRAINER", "TRAINEE"];

interface UpdateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSuccess: () => void;
}

const getDisplayName = (user: User | null) => {
  if (!user) return "";
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : user.userName;
};

export default function UpdateRoleModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: UpdateRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | "">(
    user ? (user.role as UserRole) : "",
  );

  useEffect(() => {
    if (user) {
      setSelectedRole(user.role as UserRole);
    }
  }, [user]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedRole) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await updateUserRole(user.id, selectedRole as UserRole);
      toast.success("Role updated successfully");
      onSuccess();
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to update role");
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (user) {
      setSelectedRole(user.role as UserRole);
    }
    setError(null);
    onClose();
  };

  if (!user) return null;

  const displayName = getDisplayName(user);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-md p-6"
    >
      <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
        Update Role
      </h3>
      <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
        Change role for <span className="font-medium text-gray-700 dark:text-gray-300">{displayName}</span>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="role-select"
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Role
          </label>
          <select
            id="role-select"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
            className="h-11 w-full appearance-none rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
            aria-label="Select role"
          >
            <option value="" disabled>
              Select role
            </option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        {error && (
          <p className="text-sm text-error-600 dark:text-error-500">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!selectedRole || isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
