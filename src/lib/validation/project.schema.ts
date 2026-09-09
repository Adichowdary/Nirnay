import { z } from "zod";
import { PaginationSchema } from "./common";

export const CreateProjectSchema = z.object({
  name: z.string().min(2).max(200),
  scheme_name: z.string().optional(),
  description: z.string().optional(),
  organization_id: z.string().uuid().optional(),
  state: z.string().min(1),
  district: z.string().min(1),
  block: z.string().optional(),
  status: z.enum(["active", "under-inspection", "completed", "flagged", "suspended"]).default("active"),
});

export const UpdateProjectSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  scheme_name: z.string().optional(),
  description: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  block: z.string().optional(),
  status: z.enum(["active", "under-inspection", "completed", "flagged", "suspended"]).optional(),
});

export const ListProjectsSchema = PaginationSchema.extend({
  state: z.string().optional(),
  district: z.string().optional(),
  status: z.enum(["active", "under-inspection", "completed", "flagged", "suspended"]).optional(),
  organization_id: z.string().uuid().optional(),
  search: z.string().optional(),
  min_risk_score: z.coerce.number().optional(),
  max_risk_score: z.coerce.number().optional(),
});
