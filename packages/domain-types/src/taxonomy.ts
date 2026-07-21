import { z } from "zod";

// Mirrors catalog.themes / catalog.genres / catalog.literary_movements —
// same shape, three lookup tables editors curate through Directus
// (SPEC-09).
export const ThemeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable(),
});
export type Theme = z.infer<typeof ThemeSchema>;

export const GenreSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable(),
});
export type Genre = z.infer<typeof GenreSchema>;

export const LiteraryMovementSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().nullable(),
  periodStartYear: z.number().int().nullable(),
  periodEndYear: z.number().int().nullable(),
});
export type LiteraryMovement = z.infer<typeof LiteraryMovementSchema>;
