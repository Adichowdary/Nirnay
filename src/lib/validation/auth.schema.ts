import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(2, "Name is required").max(100),
  phone: z.string().optional(),
  role: z
    .enum([
      "CENTRAL_ADMIN",
      "STATE_ADMIN",
      "INSPECTION_OFFICER",
      "PMU_USER",
      "PROJECT_ADMIN",
      "NGO_ADMIN",
      "NGO_INSTITUTE",
      "STAFF",
      "BENEFICIARY",
      "NORMAL_USER",
      "ADMIN",
      "DOSJE_OFFICIAL",
    ])
    .default("INSPECTION_OFFICER"),
  organization_id: z.string().uuid().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
});

export const ChangePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8, "New password must be at least 8 characters"),
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
