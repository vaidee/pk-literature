import { z } from "zod";

// SPEC-07's "User Profile" fields, minus password_hash (never leaves
// the server — see apps/api-identity/src/auth).
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(1),
  phone: z.string().nullable(),
  preferredLanguage: z.string(),
  createdAt: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;

// SPEC-07's "Address Book" — a *saved, reusable* entry a registered
// user manages (GET/POST/PATCH/DELETE /addresses), distinct from
// commerce.ts's `Address`, which is an immutable snapshot captured at
// checkout time. Named differently on purpose so importing both in the
// same file is never ambiguous.
export const SavedAddressSchema = z.object({
  id: z.string().uuid().optional(),
  recipientName: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().nullable(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().length(2).default("IN"),
  phone: z.string().min(1),
  isDefault: z.boolean().default(false),
});
export type SavedAddress = z.infer<typeof SavedAddressSchema>;
