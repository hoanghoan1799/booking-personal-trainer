import z from "zod";

import { UserTypeEnum } from "@/enums/user.enum";

const passwordSchema = z
  .string()
  .min(6, { message: "Password must be at least 6 characters" });

export const signUpSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .pipe(
      z.email({ message: 'Invalid email address' })
    ),

  password: passwordSchema,

  userName: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters' }),

  firstName: z
    .string()
    .min(1, { message: 'First name is required' }),

  lastName: z
    .string()
    .min(1, { message: 'Last name is required' }),

  userType: UserTypeEnum,
});

export type SignUpBody = z.infer<typeof signUpSchema>;
