import { z } from "zod";

const email = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .max(255, "Email is too long");

// Same rules as the API.
const strongPassword = z
  .string()
  .min(8, "Use at least 8 characters")
  .max(128, "Use at most 128 characters")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/\d/, "Add a number");

const mustMatch = (a: string, b: string) => ({
  check: (data: Record<string, string>) => data[a] === data[b],
  options: { path: [b], message: "Passwords do not match" },
});

const registerMatch = mustMatch("password", "confirmPassword");
const changeMatch = mustMatch("newPassword", "confirmPassword");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required").max(128),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name").max(100, "Name is too long"),
    email,
    password: strongPassword,
    confirmPassword: z.string(),
  })
  .refine(registerMatch.check, registerMatch.options);

export const forgotSchema = z.object({ email });

export const resetSchema = z
  .object({
    token: z.string().min(20, "This reset link is invalid").max(200),
    password: strongPassword,
    confirmPassword: z.string(),
  })
  .refine(registerMatch.check, registerMatch.options);

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(128),
    newPassword: strongPassword,
    confirmPassword: z.string(),
  })
  .refine(changeMatch.check, changeMatch.options);

export function fieldErrorsFrom(error: z.ZodError): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    (result[key] ??= []).push(issue.message);
  }
  return result;
}

export const organizationSchema = z.object({
  name: z.string().trim().min(2, "Enter the organization's name").max(150, "Name is too long"),
  orgType: z.enum(["school", "church", "ngo", "company", "community", "other"]),
  description: z.string().trim().max(2000, "Description is too long").optional(),
  contactEmail: z.string().trim().email("Enter a valid email address").or(z.literal("")).optional(),
  contactPhone: z.string().trim().max(30, "Phone number is too long").optional(),
});

export const drawSchema = z.object({
  title: z.string().trim().min(3, "Give the draw a title (at least 3 characters)").max(200),
  description: z.string().trim().max(5000).optional(),
  scheduledAt: z
    .string()
    .regex(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})?$/, "Enter a valid date and time")
    .optional(),
  ticketDigits: z.coerce.number().int().min(4).max(6),
  categories: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Every prize needs a name").max(150),
        prize: z.string().trim().max(255, "Prize description is too long").optional(),
        winners: z.coerce.number().int().min(1, "Each prize needs at least 1 winner").max(1000),
      }),
    )
    .max(30, "A draw can have at most 30 prizes"),
});