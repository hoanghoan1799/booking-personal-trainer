"use client";

const ROLE_STYLES = {
  ADMIN: {
    text: "#D32F2F",
    bg: "#FFEBEE",
  },
  TRAINER: {
    text: "#1976D2",
    bg: "#E3F2FD",
  },
  TRAINEE: {
    text: "#388E3C",
    bg: "#E8F5E9",
  },
} as const;

type RoleKey = keyof typeof ROLE_STYLES;

interface RoleBadgeProps {
  role: string;
  size?: "sm" | "md";
}

export default function RoleBadge({ role, size = "sm" }: RoleBadgeProps) {
  const key = role.toUpperCase() as RoleKey;
  const style = ROLE_STYLES[key] ?? {
    text: "#616161",
    bg: "#F5F5F5",
  };

  const sizeClass = size === "sm" ? "text-xs" : "text-sm";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 font-medium ${sizeClass}`}
      style={{
        backgroundColor: style.bg,
        color: style.text,
      }}
      role="status"
    >
      {role}
    </span>
  );
}
