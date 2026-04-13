"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useEffect, useRef } from "react";
import { useProfile } from "@/hooks/useProfile";
import { getAccessToken as getBackendAccessToken } from "@/lib/token";
import { syncAuth0SessionWithBackend } from "@/services/auth/auth0-backend.service";
import { useToast } from "@/context/ToastContext";

/**
 * When the user has an Auth0 session but no Nest JWT in localStorage, exchanges the Auth0 token
 * for application tokens and refetches the profile (Step 2 of Auth0 + API integration).
 */
export default function Auth0BackendSync(): null {
  const { user, isLoading: isAuth0Loading } = useUser();
  const { refetch: refetchProfile } = useProfile();
  const toast = useToast();
  const failedForSubRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (isAuth0Loading) {
      return;
    }
    if (!user?.sub) {
      failedForSubRef.current = null;
      return;
    }
    if (getBackendAccessToken()) {
      failedForSubRef.current = null;
      return;
    }
    if (failedForSubRef.current === user.sub || inFlightRef.current) {
      return;
    }
    inFlightRef.current = true;
    void (async () => {
      try {
        await syncAuth0SessionWithBackend();
        failedForSubRef.current = null;
        await refetchProfile();
      } catch (err) {
        failedForSubRef.current = user.sub ?? null;
        const message =
          err instanceof Error ? err.message : "Could not link Auth0 to your account";
        toast.error(message);
      } finally {
        inFlightRef.current = false;
      }
    })();
    // toast is stable from context; omit to avoid unnecessary effect runs
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetchProfile is stable from ProfileContext
  }, [user?.sub, isAuth0Loading, refetchProfile]);

  return null;
}
