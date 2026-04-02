"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "@/types/user.types";
import { useModal } from "../../hooks/useModal";
import {
  updateProfileSchema,
  type UpdateProfileFormData,
  type UpdateProfileFormInput,
} from "@/schemas/update-profile.schema";
import { updateProfile } from "@/services/auth/auth.service";
import { getErrorMessage } from "@/lib/error.utils";
import { useToast } from "@/context/ToastContext";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";

interface UserInfoCardProps {
  user: User | null;
  onProfileUpdated?: (updatedUser: User) => void;
}

export default function UserInfoCard({ user, onProfileUpdated }: UserInfoCardProps) {
  const { isOpen, openModal, closeModal } = useModal();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<UpdateProfileFormInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      age: user?.age,
      height: user?.height,
      weight: user?.weight,
    },
  });

  const handleOpenModal = () => {
    setSubmitError(null);
    reset({
      age: user?.age,
      height: user?.height,
      weight: user?.weight,
    });
    openModal();
  };

  const handleSave = async (data: UpdateProfileFormInput) => {
    setSubmitError(null);
    try {
      const toNum = (v: string | number | undefined) =>
        v === "" || v === undefined ? undefined : Number(v);
      const age = toNum(data.age);
      const height = toNum(data.height);
      const weight = toNum(data.weight);
      const payload: { age?: number; height?: number; weight?: number } = {};
      if (age != null && !Number.isNaN(age) && age >= 1 && age <= 150) payload.age = age;
      if (height != null && !Number.isNaN(height) && height > 0 && height <= 300) payload.height = height;
      if (weight != null && !Number.isNaN(weight) && weight > 0 && weight <= 500) payload.weight = weight;
      const updatedUser = await updateProfile(payload);
      toast.success("Profile updated successfully");
      closeModal();
      onProfileUpdated?.(updatedUser);
    } catch (error) {
      const msg = getErrorMessage(error, "Failed to update profile");
      setSubmitError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Personal Information
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7 2xl:gap-x-32">
            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                First Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.firstName ?? "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Last Name
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.lastName ?? "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Username
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.userName ?? "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Email address
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.email ?? "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Age
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.age != null ? user.age : "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Height (cm)
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.height != null ? `${user.height} cm` : "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Weight (kg)
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.weight != null ? `${user.weight} kg` : "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Role
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.role ?? "—"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs leading-normal text-gray-500 dark:text-gray-400">
                Account Type
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {user?.userType ?? "—"}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
        >
          <svg
            className="fill-current"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
              fill=""
            />
          </svg>
          Edit
        </button>
      </div>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your profile details. All fields are optional.
            </p>
          </div>
          <form
            onSubmit={handleSubmit(handleSave, (err) => console.error("Validation errors:", err))}
            className="flex flex-col"
          >
            <div className="px-2 pb-3">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Enter your age"
                    min={1}
                    max={150}
                    {...register("age")}
                  />
                  {errors.age && (
                    <p className="mt-1 text-sm text-error-500">
                      {errors.age.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="Enter height in cm"
                    min={1}
                    max={300}
                    step={0.1}
                    {...register("height")}
                  />
                  {errors.height && (
                    <p className="mt-1 text-sm text-error-500">
                      {errors.height.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="Enter weight in kg"
                    min={1}
                    max={500}
                    step={0.1}
                    {...register("weight")}
                  />
                  {errors.weight && (
                    <p className="mt-1 text-sm text-error-500">
                      {errors.weight.message}
                    </p>
                  )}
                </div>
              </div>

              {submitError && (
                <p className="mt-4 text-sm text-error-500">{submitError}</p>
              )}
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={closeModal}
              >
                Close
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isSubmitting}
                onClick={handleSubmit(handleSave)}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
