"use client";

import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import type { User } from "@auth0/nextjs-auth0/types";
import type { ReactNode } from "react";

type Auth0UserProviderProps = {
  readonly children: ReactNode;
  readonly user?: User;
};

export default function Auth0UserProvider({
  children,
  user,
}: Auth0UserProviderProps) {
  return <Auth0Provider user={user}>{children}</Auth0Provider>;
}

