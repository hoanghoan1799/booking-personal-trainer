export const MUSCLE_GROUP = {
  CHEST: "CHEST",
  BACK: "BACK",
  LEGS: "LEGS",
  SHOULDERS: "SHOULDERS",
  ARMS: "ARMS",
  CORE: "CORE",
} as const;

export const EQUIPMENT = {
  BARBELL: "BARBELL",
  DUMBBELL: "DUMBBELL",
  MACHINE: "MACHINE",
  BODYWEIGHT: "BODYWEIGHT",
} as const;

export type MuscleGroup = (typeof MUSCLE_GROUP)[keyof typeof MUSCLE_GROUP];
export type Equipment = (typeof EQUIPMENT)[keyof typeof EQUIPMENT];
