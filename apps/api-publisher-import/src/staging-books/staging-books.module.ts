import { Module } from "@nestjs/common";
import { StagingBooksController } from "./staging-books.controller";
import { StagingBooksService } from "./staging-books.service";
import { EventBridgeService } from "../common/eventbridge.service";
import { MediaStorageService } from "../common/media-storage.service";

@Module({
  controllers: [StagingBooksController],
  providers: [StagingBooksService, EventBridgeService, MediaStorageService],
})
export class StagingBooksModule {}
