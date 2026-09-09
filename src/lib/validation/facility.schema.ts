import { z } from "zod";
import { PaginationSchema } from "./common";

export const CreateFacilitySchema = z.object({
  name: z.string().min(2).max(200),
  project_id: z.string().uuid(),
  organization_id: z.string().uuid().optional(),
  type: z.enum(["hostel", "office", "field", "warehouse", "other"]),
  address: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  block: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  geofence_radius: z.number().int().min(50).max(5000).default(200),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
});

export const UpdateFacilitySchema = z.object({
  name: z.string().min(2).max(200).optional(),
  type: z.enum(["hostel", "office", "field", "warehouse", "other"]).optional(),
  address: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  geofence_radius: z.number().int().min(50).max(5000).optional(),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const ListFacilitiesSchema = PaginationSchema.extend({
  project_id: z.string().uuid().optional(),
  type: z.enum(["hostel", "office", "field", "warehouse", "other"]).optional(),
  state: z.string().optional(),
  search: z.string().optional(),
});
