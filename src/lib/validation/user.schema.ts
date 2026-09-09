import { z } from "zod";
import { PaginationSchema } from "./common";

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2).max(100),
  phone: z.string().optional(),
  role: z.enum([
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
  ]),
  organization_id: z.string().uuid().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
});

export const UpdateUserSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  avatar_url: z.string().url().optional(),
  is_active: z.boolean().optional(),
});

export const ListUsersSchema = PaginationSchema.extend({
  role: z.string().optional(),
  organization_id: z.string().uuid().optional(),
  state: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type ListUsersInput = z.infer<typeof ListUsersSchema>;
