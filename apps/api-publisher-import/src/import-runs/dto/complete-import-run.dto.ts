import { IsIn, IsOptional, IsString } from "class-validator";

export class CompleteImportRunDto {
  @IsIn(["completed", "failed", "partially_failed"])
  status!: "completed" | "failed" | "partially_failed";

  // Written back to catalog.publishers.last_import_cursor only when
  // provided — ADR-009: "written back on successful run completion
  // only ... a failed/partial run does not advance the watermark."
  // Callers should omit this on status=failed.
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @IsString()
  errorSummary?: string;
}
