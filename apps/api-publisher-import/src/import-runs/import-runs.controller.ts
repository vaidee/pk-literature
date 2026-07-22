import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ImportRunsService } from "./import-runs.service";
import { StartImportRunDto } from "./dto/start-import-run.dto";
import { CompleteImportRunDto } from "./dto/complete-import-run.dto";

// IAM-authenticated (API Gateway route authorization_type=AWS_IAM,
// terraform/environments/<env>/api-publisher-import.tf) — only the
// gha-publisher-import-<env> OIDC role's SigV4-signed requests reach
// here (ADR-009). Not part of SPEC-16's public API surface.
@Controller()
export class ImportRunsController {
  constructor(private readonly importRuns: ImportRunsService) {}

  @Get("publishers/:publisherId/cursor")
  async getCursor(@Param("publisherId") publisherId: string) {
    return this.importRuns.getCursor(publisherId);
  }

  @Post("publishers/:publisherId/import-runs")
  async start(@Param("publisherId") publisherId: string, @Body() dto: StartImportRunDto) {
    return this.importRuns.start(publisherId, dto.trigger);
  }

  @Post("import-runs/:runId/complete")
  async complete(@Param("runId") runId: string, @Body() dto: CompleteImportRunDto) {
    return this.importRuns.complete(runId, dto);
  }
}
