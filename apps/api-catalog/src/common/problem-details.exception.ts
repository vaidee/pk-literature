import { HttpException } from "@nestjs/common";
import type { ProblemDetails, ProblemType } from "@pk-literature/contracts";
import { PROBLEM_STATUS } from "@pk-literature/contracts";

// Every thrown error in this service becomes an RFC7807 problem-details
// body (plan/contracts/errors/problem-details.md) — coding-guidelines.md:
// "no ad hoc { error: 'message' } shapes."
export class ProblemDetailsException extends HttpException {
  constructor(type: ProblemType, detail?: string, instance?: string) {
    const status = PROBLEM_STATUS[type];
    const body: ProblemDetails = { type, title: type, status, detail, instance };
    super(body, status);
  }
}

export class NotFoundProblem extends ProblemDetailsException {
  constructor(resource: string, id: string) {
    super("NotFound", `${resource} ${id} was not found.`);
  }
}

export class ValidationProblem extends ProblemDetailsException {
  constructor(detail: string) {
    super("ValidationError", detail);
  }
}
