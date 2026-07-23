// Request/response shapes for the Identity API (SPEC-07). See
// apps/api-identity. Access/refresh tokens travel as secure HTTP-only
// cookies (SPEC-07 "Session Management"), never in a JSON response
// body — none of the Response types below carry a token field on
// purpose, even though the request DTOs obviously carry credentials.

import type { SavedAddress, User } from "@pk-literature/domain-types";

// POST /auth/register
export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  phone?: string;
}
export type RegisterResponse = User;

// POST /auth/login
export interface LoginRequest {
  email: string;
  password: string;
}
export type LoginResponse = User;

// POST /auth/logout
export interface LogoutResponse {
  loggedOut: true;
}

// GET /profile
export type GetProfileResponse = User;

// PATCH /profile
export interface UpdateProfileRequest {
  displayName?: string;
  phone?: string;
  preferredLanguage?: string;
}
export type UpdateProfileResponse = User;

// GET /addresses
export type ListAddressesResponse = SavedAddress[];

// POST /addresses
export type CreateAddressRequest = Omit<SavedAddress, "id">;
export type CreateAddressResponse = SavedAddress;

// PATCH /addresses/{id}
export type UpdateAddressRequest = Partial<Omit<SavedAddress, "id">>;
export type UpdateAddressResponse = SavedAddress;

// DELETE /addresses/{id}
export interface DeleteAddressResponse {
  deleted: true;
}
