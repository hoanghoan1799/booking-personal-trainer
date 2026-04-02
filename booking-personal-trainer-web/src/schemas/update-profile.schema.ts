import z from "zod";

const optionalNumber = z
  .union([z.string(), z.number()])
  .optional()
  .transform((val) =>
    val === "" || val === undefined ? undefined : Number(val),
  );

export const updateProfileSchema = z.object({
  age: optionalNumber.refine(
    (val) => val === undefined || (val >= 1 && val <= 150),
    { message: "Age must be between 1 and 150" },
  ),
  height: optionalNumber.refine(
    (val) => val === undefined || (val > 0 && val <= 300),
    { message: "Height must be between 1 and 300 cm" },
  ),
  weight: optionalNumber.refine(
    (val) => val === undefined || (val > 0 && val <= 500),
    { message: "Weight must be between 1 and 500 kg" },
  ),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type UpdateProfileFormInput = z.input<typeof updateProfileSchema>;
