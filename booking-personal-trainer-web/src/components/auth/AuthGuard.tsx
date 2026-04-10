"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, clearTokens } from "@/lib/token";
import { useUser } from "@auth0/nextjs-auth0/client";

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
  const { user, isLoading } = useUser();

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
