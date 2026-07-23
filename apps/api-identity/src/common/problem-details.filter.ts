import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response, Request } from "express";
import type { ProblemDetails } from "@pk-literature/contracts";
import { PROBLEM_STATUS } from "@pk-literature/contracts";
import { ProblemDetailsException } from "./problem-details.exception";

// Global filter: whatever gets thrown (our own ProblemDetailsException,
// Nest's built-in HttpException from ValidationPipe, or an unexpected
// error), the client always sees one RFC7807 shape, never a stack trace
// or Nest's default { statusCode, message } body.
@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemDetailsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof ProblemDetailsException) {
      const body = exception.getResponse() as ProblemDetails;
      response.status(body.status).json({ ...body, instance: request.url });
      return;
    }

    if (exception instanceof HttpException) {
      // e.g. Nest's ValidationPipe throws a plain BadRequestException —
      // normalize it into the same shape rather than leaking Nest's
      // default { statusCode, message, error } body.
      const status = exception.getStatus();
      const responseBody = exception.getResponse();
      const detail =
        typeof responseBody === "string"
          ? responseBody
          : Array.isArray((responseBody as { message?: string[] }).message)
            ? (responseBody as { message: string[] }).message.join("; ")
            : ((responseBody as { message?: string }).message ?? exception.message);

      const body: ProblemDetails = {
        type: status === HttpStatus.BAD_REQUEST ? "ValidationError" : "InternalError",
        title: status === HttpStatus.BAD_REQUEST ? "ValidationError" : "InternalError",
        status: PROBLEM_STATUS[status === HttpStatus.BAD_REQUEST ? "ValidationError" : "InternalError"],
        detail,
        instance: request.url,
      };
      response.status(body.status).json(body);
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : exception);
    const body: ProblemDetails = {
      type: "InternalError",
      title: "InternalError",
      status: 500,
      instance: request.url,
    };
    response.status(500).json(body);
  }
}
