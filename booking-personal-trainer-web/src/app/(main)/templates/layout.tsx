import type React from "react";
import RequireNotTrainee from "@/components/auth/RequireNotTrainee";

type TemplatesLayoutProps = {
  readonly children: React.ReactNode;
};

export default function TemplatesLayout(
  props: TemplatesLayoutProps,
): React.ReactNode {
  const { children } = props;
  return <RequireNotTrainee>{children}</RequireNotTrainee>;
}

