"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken, clearTokens } from "@/lib/token";

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

  useEffect(() => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      clearTokens();
      router.replace(APP_ROUTES.SIGNIN);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsVerified(true);
  }, [router]);

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
