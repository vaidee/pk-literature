import { Module } from "@nestjs/common";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";
import { BookCardBuilder } from "../common/book-card-builder";

@Module({
  controllers: [SearchController],
  providers: [SearchService, BookCardBuilder],
  exports: [BookCardBuilder],
})
export class SearchModule {}
