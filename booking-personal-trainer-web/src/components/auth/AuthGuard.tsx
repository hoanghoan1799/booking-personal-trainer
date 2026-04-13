"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, clearTokens } from "@/lib/token";
import { useAuth0User } from "@/hooks/useAuth0User";

const APP_ROUTES = {
  SIGNIN: "/signin",
} as const;

export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const { user, isLoading } = useAuth0User();

  useEffect(() => {
    if (isLoading) {
      return;
    }
    const accessToken = getAccessToken();
    const isAuth0Authenticated = Boolean(user);
    if (!accessToken && !isAuth0Authenticated) {
      clearTokens();
      router.replace(APP_ROUTES.SIGNIN);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsVerified(true);
  }, [isLoading, router, user]);

  if (!isVerified) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900"
        aria-label="Verifying authentication"
      />
    );
  }

  return <>{children}</>;
}
