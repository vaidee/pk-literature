import { Module } from "@nestjs/common";
import { BrowseController } from "./browse.controller";
import { BrowseService } from "./browse.service";
import { SimilarBooksController } from "./similar-books.controller";
import { SimilarBooksService } from "./similar-books.service";
import { BookCardBuilder } from "../common/book-card-builder";

@Module({
  controllers: [BrowseController, SimilarBooksController],
  providers: [BrowseService, SimilarBooksService, BookCardBuilder],
})
export class BrowseModule {}
