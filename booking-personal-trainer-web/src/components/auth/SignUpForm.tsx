"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Auth0LogoIcon from "@/components/icons/Auth0LogoIcon";
import {
  signUpSchema,
  type SignUpBody,
} from "@/schemas/sign-up.schema";
import { register as registerUser } from "@/services/auth/auth.service";
import { APP_ROUTES } from "@/lib/route.constants";
import { getErrorMessage } from "@/lib/error.utils";
import { useToast } from "@/context/ToastContext";
import { useProfile } from "@/hooks/useProfile";
import { useRouter } from "next/navigation";

export default function SignUpForm() {
  const toast = useToast();
  const { refetch: refetchProfile } = useProfile();
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpBody>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { userType: "TRAINEE" },
  });

  const onSubmit = async (data: SignUpBody) => {
    try {
      await registerUser(data);
      toast.success("Account created successfully");
      await refetchProfile();
      router.push("/");
    } catch (error) {
      toast.error(getErrorMessage(error, "Registration failed"));
    }
  };

  const handleAuth0Login = (): void => {
    if (typeof window === "undefined") {
      return;
    }
    window.location.href = "/auth/login?returnTo=/";
  };

  return (
    <div className="flex flex-col flex-1 lg:w-1/2 w-full overflow-y-auto no-scrollbar">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign Up
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your details to create an account.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <Label>
                    First Name <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    placeholder="Enter your first name"
                    {...register("firstName")}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-error-500">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-1">
                  <Label>
                    Last Name <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    placeholder="Enter your last name"
                    {...register("lastName")}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-error-500">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label>
                  Username <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  placeholder="Enter your username"
                  {...register("userName")}
                />
                {errors.userName && (
                  <p className="mt-1 text-sm text-error-500">
                    {errors.userName.message}
                  </p>
                )}
              </div>

              <div>
                <Label>
                  Email <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-error-500">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...register("password")}
                  />
                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    role="button"
                    tabIndex={0}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onKeyDown={(e) =>
                      e.key === "Enter" && setShowPassword((prev) => !prev)
                    }
                  >
                    {showPassword ? (
                      <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                    )}
                  </span>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-error-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <Label>
                  Account Type <span className="text-error-500">*</span>
                </Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="TRAINEE"
                      {...register("userType")}
                      className="w-4 h-4 border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Trainee
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value="TRAINER"
                      {...register("userType")}
                      className="w-4 h-4 border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Trainer
                    </span>
                  </label>
                </div>
                {errors.userType && (
                  <p className="mt-1 text-sm text-error-500">
                    {errors.userType.message}
                  </p>
                )}
              </div>

              <div>
                <Button
                  type="submit"
                  size="sm"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Signing up..." : "Sign Up"}
                </Button>
              </div>
            </div>
          </form>

          <div className="my-6 flex items-center gap-3" aria-label="Or sign up with">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
            <span className="text-xs text-gray-500 dark:text-gray-400">OR</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
          </div>

          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full"
            onClick={handleAuth0Login}
            aria-label="Continue with Auth0"
            endIcon={<Auth0LogoIcon className="text-gray-700 dark:text-gray-300" />}
          >
            Continue with Auth0
          </Button>

          <div className="mt-5">
            <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
              Already have an account?{" "}
              <Link
                href={APP_ROUTES.SIGNIN}
                className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
