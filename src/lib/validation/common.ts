import { z } from "zod";

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("desc"),
  sort_by: z.string().optional(),
});

export const UuidParam = z.object({
  id: z.string().uuid("Invalid UUID format"),
});

export const SearchQuery = z.object({
  q: z.string().min(1, "Search query required").max(200),
});

export type PaginationInput = z.infer<typeof PaginationSchema>;

export function paginate(query: { page: number; limit: number }) {
  const offset = (query.page - 1) * query.limit;
  return { from: offset, to: offset + query.limit - 1 };
}
