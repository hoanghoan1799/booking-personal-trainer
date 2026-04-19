import type { User } from "@/types/user.types";

export const getUserDisplayName = (user: Pick<User, "firstName" | "lastName" | "userName">): string => {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : user.userName;
};
