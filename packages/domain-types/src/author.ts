import { z } from "zod";
import { MediaAssetSchema } from "./media-asset";

// Mirrors catalog.authors. Also used for edition-specific contributors
// (translator/illustrator/editor) via catalog.book_contributors — see
// ContributorSchema below, which wraps this with a role.
export const AuthorSchema = z.object({
  id: z.string().uuid(),
  canonicalName: z.string().min(1),
  nativeName: z.string().nullable(),
  biography: z.string().nullable(),
  birthYear: z.number().int().nullable(),
  deathYear: z.number().int().nullable(),
  photo: MediaAssetSchema.nullable(),
});
export type Author = z.infer<typeof AuthorSchema>;

export const AuthorSummarySchema = AuthorSchema.pick({
  id: true,
  canonicalName: true,
});
export type AuthorSummary = z.infer<typeof AuthorSummarySchema>;

// catalog.work_authors.role — 'author' | 'co_author' | 'compiler'
export const WorkAuthorRoleSchema = z.enum(["author", "co_author", "compiler"]);
export type WorkAuthorRole = z.infer<typeof WorkAuthorRoleSchema>;

export const WorkAuthorSchema = z.object({
  author: AuthorSummarySchema,
  role: WorkAuthorRoleSchema,
});
export type WorkAuthorEntry = z.infer<typeof WorkAuthorSchema>;

// catalog.book_contributors.role — 'translator' | 'illustrator' | 'editor' | 'foreword'
export const BookContributorRoleSchema = z.enum([
  "translator",
  "illustrator",
  "editor",
  "foreword",
]);
export type BookContributorRole = z.infer<typeof BookContributorRoleSchema>;

export const BookContributorSchema = z.object({
  author: AuthorSummarySchema,
  role: BookContributorRoleSchema,
});
export type BookContributorEntry = z.infer<typeof BookContributorSchema>;
