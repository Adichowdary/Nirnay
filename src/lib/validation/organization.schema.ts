import { z } from "zod";
import { PaginationSchema } from "./common";

export const CreateOrganizationSchema = z.object({
  name: z.string().min(2).max(200),
  type: z.enum(["NGO", "INSTITUTE", "GOVERNMENT", "PRIVATE"]),
  registration_no: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
});

export const UpdateOrganizationSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  address: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  is_verified: z.boolean().optional(),
});

export const ListOrganizationsSchema = PaginationSchema.extend({
  type: z.enum(["NGO", "INSTITUTE", "GOVERNMENT", "PRIVATE"]).optional(),
  state: z.string().optional(),
  search: z.string().optional(),
});
