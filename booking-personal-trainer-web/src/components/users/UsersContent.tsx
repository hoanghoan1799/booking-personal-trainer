"use client";

import { useState } from "react";
import type { User } from "@/types/user.types";
import { useUsers } from "@/hooks/useUsers";
import UserCard from "./UserCard";
import UpdateRoleModal from "./UpdateRoleModal";
import CreateBookingModal from "./CreateBookingModal";

const SECTION_TITLES = {
  ADMIN: "Admins",
  TRAINER: "Trainers",
  TRAINEE: "Trainees",
} as const;

const EMPTY_MESSAGE = "No users in this group.";

function UserGroupSection({
  title,
  users,
  isWaitingForApproval,
  onUserClick,
}: {
  title: string;
  users: User[];
  isWaitingForApproval: (u: User) => boolean;
  onUserClick: (u: User) => void;
}) {
  return (
    <section className="space-y-4">
      <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
        {title}
      </h4>
      {users.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {EMPTY_MESSAGE}
        </p>
      ) : (
        <ul
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
        >
          {users.map((u) => (
            <li key={u.id}>
              <UserCard
                user={u}
                showWaitingBadge={isWaitingForApproval(u)}
                onClick={() => onUserClick(u)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function UserListSection({
  title,
  emptyMessage,
  users,
  showWaitingBadge = false,
  onUserClick,
}: {
  title: string;
  emptyMessage: string;
  users: User[];
  showWaitingBadge?: boolean;
  onUserClick?: (u: User) => void;
}) {
  return (
    <section className="space-y-4">
      <h4 className="text-base font-semibold text-gray-800 dark:text-white/90">
        {title}
      </h4>
      {users.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {emptyMessage}
        </p>
      ) : (
        <ul
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          role="list"
        >
          {users.map((u) => (
            <li key={u.id}>
              <UserCard
                user={u}
                showWaitingBadge={showWaitingBadge}
                onClick={onUserClick ? () => onUserClick(u) : undefined}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function UsersContent() {
  const {
    groupedUsers,
    ptList,
    approvedTrainers,
    assignedTrainees,
    isLoading,
    error,
    isAdmin,
    isTrainer,
    isWaitingForApproval,
    refetch,
  } = useUsers();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [updateRoleModalOpen, setUpdateRoleModalOpen] = useState(false);
  const [createBookingModalOpen, setCreateBookingModalOpen] = useState(false);

  const handleAdminUserClick = (user: User) => {
    setSelectedUser(user);
    setUpdateRoleModalOpen(true);
  };

  const handlePtClick = (user: User) => {
    setSelectedUser(user);
    setCreateBookingModalOpen(true);
  };

  const handleUpdateRoleSuccess = () => {
    refetch();
  };

  const handleCreateBookingSuccess = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Loading users...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-error-500/30 bg-error-50 p-4 dark:border-error-500/20 dark:bg-error-500/10">
        <p className="text-sm text-error-600 dark:text-error-500">
          {error.message}
        </p>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <>
        <div className="space-y-10">
          <UserGroupSection
            title={SECTION_TITLES.ADMIN}
            users={groupedUsers.admins}
            isWaitingForApproval={isWaitingForApproval}
            onUserClick={handleAdminUserClick}
          />
          <UserGroupSection
            title={SECTION_TITLES.TRAINER}
            users={groupedUsers.trainers}
            isWaitingForApproval={isWaitingForApproval}
            onUserClick={handleAdminUserClick}
          />
          <UserGroupSection
            title={SECTION_TITLES.TRAINEE}
            users={groupedUsers.trainees}
            isWaitingForApproval={isWaitingForApproval}
            onUserClick={handleAdminUserClick}
          />
        </div>
        <UpdateRoleModal
          isOpen={updateRoleModalOpen}
          onClose={() => setUpdateRoleModalOpen(false)}
          user={selectedUser}
          onSuccess={handleUpdateRoleSuccess}
        />
      </>
    );
  }

  if (isTrainer) {
    return (
      <>
        <div className="space-y-10">
          <UserListSection
            title="Approved Personal Trainers"
            emptyMessage="No approved personal trainers yet."
            users={approvedTrainers}
            onUserClick={handlePtClick}
          />
          <UserListSection
            title="Assigned Trainees"
            emptyMessage="No assigned trainees yet."
            users={assignedTrainees}
          />
        </div>
        <CreateBookingModal
          isOpen={createBookingModalOpen}
          onClose={() => setCreateBookingModalOpen(false)}
          trainer={selectedUser}
          onSuccess={handleCreateBookingSuccess}
        />
      </>
    );
  }

  return (
    <>
      <div>
        <UserListSection
          title="Approved Personal Trainers"
          emptyMessage="No approved personal trainers yet."
          users={ptList}
          onUserClick={handlePtClick}
        />
      </div>
      <CreateBookingModal
        isOpen={createBookingModalOpen}
        onClose={() => setCreateBookingModalOpen(false)}
        trainer={selectedUser}
        onSuccess={handleCreateBookingSuccess}
      />
    </>
  );
}
