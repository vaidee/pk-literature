import { IsIn } from "class-validator";

// SPEC-04 §9 / §22's ImportStarted trigger values — "scheduled" is a
// GitHub Actions cron firing, "manual" a workflow_dispatch run,
// "retry" a re-run of a previously failed/partially_failed run.
export class StartImportRunDto {
  @IsIn(["scheduled", "manual", "retry"])
  trigger!: "scheduled" | "manual" | "retry";
}
