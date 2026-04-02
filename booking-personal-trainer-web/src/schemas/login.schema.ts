import z from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'Email is required' })
    .pipe(
      z.email({ message: 'Invalid email address' })
    ),

  password: z
    .string()
    .min(6, { message: 'Password is required' }),
});

export type LoginBody = z.infer<typeof loginSchema>;
