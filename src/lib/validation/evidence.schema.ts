import { z } from "zod";
import { PaginationSchema } from "./common";

export const UploadEvidenceSchema = z.object({
  inspection_id: z.string().uuid(),
  project_id: z.string().uuid(),
  type: z.enum(["photo", "video", "audio", "document"]),
  file_name: z.string().optional(),
  sha256_hash: z.string().min(1),
  mime_type: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  location_accuracy_m: z.number().min(0).optional(),
  captured_at: z.string().datetime(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const ListEvidenceSchema = PaginationSchema.extend({
  inspection_id: z.string().uuid().optional(),
  project_id: z.string().uuid().optional(),
  type: z.enum(["photo", "video", "audio", "document"]).optional(),
});
