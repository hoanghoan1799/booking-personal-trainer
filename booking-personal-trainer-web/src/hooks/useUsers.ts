"use client";

import { useCallback, useEffect, useState } from "react";
import type { User } from "@/types/user.types";
import { getUsers } from "@/services/users/users.service";
import { useProfile } from "./useProfile";

export type UserGroup = "ADMIN" | "TRAINER" | "TRAINEE";

export interface GroupedUsers {
  admins: User[];
  trainers: User[];
  trainees: User[];
}

function isWaitingForApproval(user: User): boolean {
  return (
    user.userType === "TRAINER" &&
    user.role === "TRAINEE" &&
    user.approvalStatus !== "APPROVED"
  );
}

export function useUsers() {
  const { user: currentUser, isLoading: isProfileLoading } = useProfile();
  const [groupedUsers, setGroupedUsers] = useState<GroupedUsers>({
    admins: [],
    trainers: [],
    trainees: [],
  });
  const [ptList, setPtList] = useState<User[]>([]);
  const [approvedTrainers, setApprovedTrainers] = useState<User[]>([]);
  const [assignedTrainees, setAssignedTrainees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const role = currentUser.role as string;

      if (role === "ADMIN") {
        const [adminsRes, trainersRes, traineesRes] = await Promise.all([
          getUsers({ role: "ADMIN", limit: 100 }),
          getUsers({ role: "TRAINER", limit: 100 }),
          getUsers({ role: "TRAINEE", limit: 100 }),
        ]);

        setGroupedUsers({
          admins: adminsRes.users,
          trainers: trainersRes.users,
          trainees: traineesRes.users,
        });
        setPtList([]);
      } else if (role === "TRAINER") {
        const [trainersRes, traineesRes] = await Promise.all([
          getUsers({
            role: "TRAINER",
            approvalStatus: "APPROVED",
            limit: 100,
          }),
          getUsers({
            role: "TRAINEE",
            limit: 100,
          }),
        ]);
        setApprovedTrainers(trainersRes.users);
        setAssignedTrainees(traineesRes.users);
        setPtList([]);
        setGroupedUsers({ admins: [], trainers: [], trainees: [] });
      } else {
        const res = await getUsers({
          role: "TRAINER",
          approvalStatus: "APPROVED",
          limit: 100,
        });
        setPtList(res.users);
        setApprovedTrainers([]);
        setAssignedTrainees([]);
        setGroupedUsers({ admins: [], trainers: [], trainees: [] });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load users"));
      setGroupedUsers({ admins: [], trainers: [], trainees: [] });
      setPtList([]);
      setApprovedTrainers([]);
      setAssignedTrainees([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isProfileLoading) return;
    fetchUsers();
  }, [fetchUsers, isProfileLoading]);

  const isLoadingUsers = isProfileLoading || isLoading;

  return {
    groupedUsers,
    ptList,
    approvedTrainers,
    assignedTrainees,
    isLoading: isLoadingUsers,
    error,
    refetch: fetchUsers,
    isAdmin: currentUser?.role === "ADMIN",
    isTrainer: currentUser?.role === "TRAINER",
    isWaitingForApproval,
  };
}
