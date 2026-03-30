import { z } from "zod";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_FILE_SIZE = 4 * 1024 * 1024;

export const adminLoginSchema = z.object({
  password: z.string().min(1, "Enter the admin password."),
});

export const dogInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Each dachshund needs a name.")
    .max(80, "Dog names must stay under 80 characters."),
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, "Each dachshund needs a photo.")
    .refine((file) => file.size <= MAX_FILE_SIZE, "Each photo must be 4 MB or smaller.")
    .refine((file) => ACCEPTED_TYPES.includes(file.type), "Photos must be JPG, PNG, or WebP."),
});

export const submissionSchema = z
  .object({
    householdName: z
      .string()
      .trim()
      .max(120, "Household name must stay under 120 characters."),
    dachshundCount: z.coerce
      .number()
      .int("Number of dachshunds must be a whole number.")
      .min(1, "Choose at least 1 dachshund.")
      .max(5, "Please keep submissions to 5 dachshunds or fewer."),
    dogs: z.array(dogInputSchema),
  })
  .superRefine((data, ctx) => {
    if (data.dogs.length !== data.dachshundCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The number of dog names and photos must match the dachshund count.",
        path: ["dogs"],
      });
    }
  });

export const adminPhotoSchema = z.object({
  path: z.string().min(1, "Missing photo path."),
});
