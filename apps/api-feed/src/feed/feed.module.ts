import { Module } from "@nestjs/common";
import { FeedController } from "./feed.controller";
import { FeedService } from "./feed.service";
import { BookCardBuilder } from "./book-card-builder";

@Module({
  controllers: [FeedController],
  providers: [FeedService, BookCardBuilder],
  exports: [BookCardBuilder],
})
export class FeedModule {}
