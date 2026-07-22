import { Module } from "@nestjs/common";
import { ImportRunsController } from "./import-runs.controller";
import { ImportRunsService } from "./import-runs.service";
import { EventBridgeService } from "../common/eventbridge.service";

@Module({
  controllers: [ImportRunsController],
  providers: [ImportRunsService, EventBridgeService],
})
export class ImportRunsModule {}
