import z from "zod";

export const UserTypeEnum = z.enum(["TRAINER", "TRAINEE"]);
