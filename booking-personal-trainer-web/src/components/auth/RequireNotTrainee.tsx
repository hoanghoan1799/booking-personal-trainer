"use client";

import type React from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { APP_ROUTES } from "@/lib/route.constants";
import { useProfile } from "@/hooks/useProfile";

type RequireNotTraineeProps = {
  readonly children: React.ReactNode;
};

export default function RequireNotTrainee(
  props: RequireNotTraineeProps,
): React.ReactNode {
  const { children } = props;
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useProfile();

  useEffect(() => {
    if (isLoading) return;
    const isTrainee = user?.role === "TRAINEE";
    if (!isTrainee) return;
    router.replace(APP_ROUTES.ROOT);
  }, [isLoading, router, user?.role]);

  if (isLoading) return null;
  if (user?.role === "TRAINEE") return null;

  return (
    <div aria-label={`Content for ${pathname}`} tabIndex={-1}>
      {children}
    </div>
  );
}

