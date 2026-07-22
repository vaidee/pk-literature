import { z } from "zod";
import { EditorialStatusSchema, WorkTypeSchema } from "./enums";
import { WorkAuthorSchema } from "./author";
import { ThemeSchema, GenreSchema, LiteraryMovementSchema } from "./taxonomy";

// Mirrors catalog.works — the abstract literary work, independent of
// language/edition. Owns the editorial relationships (authors, themes,
// genres, movements) that describe the content, so every Book under it
// inherits them rather than being re-tagged per edition (SPEC-15,
// ADR-008).
export const WorkSchema = z.object({
  id: z.string().uuid(),
  canonicalTitle: z.string().min(1),
  canonicalTitleTranslit: z.string().nullable(),
  originalLanguage: z.string().length(2),
  workType: WorkTypeSchema,
  firstPublicationYear: z.number().int().nullable(),
  summary: z.string().nullable(),
  status: EditorialStatusSchema,
  authors: z.array(WorkAuthorSchema),
  themes: z.array(ThemeSchema),
  genres: z.array(GenreSchema),
  literaryMovements: z.array(LiteraryMovementSchema),
});
export type Work = z.infer<typeof WorkSchema>;

export const WorkSummarySchema = WorkSchema.pick({
  id: true,
  canonicalTitle: true,
  originalLanguage: true,
}).extend({
  authors: z.array(WorkAuthorSchema),
});
export type WorkSummary = z.infer<typeof WorkSummarySchema>;
