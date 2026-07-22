import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health/health.controller";
import { FeedModule } from "./feed/feed.module";
import { InterestModule } from "./interest/interest.module";

// SPEC-05's Discovery Feed API — public, unauthenticated (SPEC-16).
@Module({
  imports: [DatabaseModule, FeedModule, InterestModule],
  controllers: [HealthController],
})
export class AppModule {}
