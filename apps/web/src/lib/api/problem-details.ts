import type { ProblemDetails } from "@pk-literature/contracts";

// Every backend service in this repo returns this exact RFC7807 shape
// on error (coding-guidelines.md) — one error class for the whole
// frontend to catch, instead of per-service ad hoc handling.
export class ApiError extends Error {
  readonly problem: ProblemDetails;

  constructor(problem: ProblemDetails) {
    super(problem.detail ?? problem.title);
    this.problem = problem;
    this.name = "ApiError";
  }

  get status(): number {
    return this.problem.status;
  }
}

export async function throwIfProblem(response: Response): Promise<void> {
  if (response.ok) return;

  let problem: ProblemDetails;
  try {
    problem = (await response.json()) as ProblemDetails;
  } catch {
    // The Lambda/API Gateway layer itself failed before ever reaching
    // application code (e.g. a cold-start timeout) — there's no
    // problem-details body to parse in that case.
    problem = {
      type: "InternalError",
      title: "InternalError",
      status: response.status as ProblemDetails["status"],
      detail: `Request failed with status ${response.status} and no parseable body.`,
    };
  }
  throw new ApiError(problem);
}
