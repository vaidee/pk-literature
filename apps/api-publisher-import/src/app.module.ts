import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health/health.controller";
import { ImportRunsModule } from "./import-runs/import-runs.module";
import { StagingBooksModule } from "./staging-books/staging-books.module";

// ADR-009's staging-ingest API — validate/duplicate-detect/write, the
// one piece of the publisher-import pipeline that runs inside AWS.
@Module({
  imports: [DatabaseModule, ImportRunsModule, StagingBooksModule],
  controllers: [HealthController],
})
export class AppModule {}
