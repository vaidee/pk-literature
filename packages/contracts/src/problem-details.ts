// RFC7807 problem-details — plan/contracts/errors/problem-details.md.
// Every API error response across every service uses this shape;
// coding-guidelines.md: "no ad hoc { error: 'message' } shapes."

export type ProblemType =
  | "ValidationError"
  | "Unauthorized"
  | "NotFound"
  | "Conflict"
  | "InternalError";

export interface ProblemDetails {
  type: ProblemType;
  title: string;
  status: 400 | 401 | 404 | 409 | 500;
  // Explicitly `| undefined`, not just optional — every consumer builds
  // this object with `exactOptionalPropertyTypes: true`, which
  // distinguishes "key omitted" from "key present with value undefined."
  // Constructors that don't yet have a detail/instance pass undefined
  // explicitly, so the type must allow it.
  detail?: string | undefined;
  instance?: string | undefined;
}

export const PROBLEM_STATUS: Record<ProblemType, ProblemDetails["status"]> = {
  ValidationError: 400,
  Unauthorized: 401,
  NotFound: 404,
  Conflict: 409,
  InternalError: 500,
};
