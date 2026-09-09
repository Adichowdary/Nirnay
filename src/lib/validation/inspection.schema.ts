import { z } from "zod";
import { PaginationSchema } from "./common";

export const CreateInspectionSchema = z.object({
  project_id: z.string().uuid(),
  facility_id: z.string().uuid().optional(),
  inspection_type: z.enum(["surprise", "scheduled", "video", "follow_up"]),
  priority: z.enum(["low", "normal", "high", "critical"]).default("normal"),
  scheduled_for: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const UpdateInspectionSchema = z.object({
  priority: z.enum(["low", "normal", "high", "critical"]).optional(),
  scheduled_for: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const ListInspectionsSchema = PaginationSchema.extend({
  project_id: z.string().uuid().optional(),
  status: z.enum(["pending", "assigned", "in_progress", "submitted", "reviewed", "closed"]).optional(),
  priority: z.enum(["low", "normal", "high", "critical"]).optional(),
  inspection_type: z.enum(["surprise", "scheduled", "video", "follow_up"]).optional(),
  assigned_to: z.string().uuid().optional(),
  search: z.string().optional(),
});

export const GpsVerificationSchema = z.object({
  inspection_id: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0),
  timestamp: z.string().datetime(),
  device_id: z.string().optional(),
});

export type CreateInspectionInput = z.infer<typeof CreateInspectionSchema>;
export type GpsVerificationInput = z.infer<typeof GpsVerificationSchema>;
