import { Module } from "@nestjs/common";
import { WorksModule } from "../works/works.module";
import { BooksController } from "./books.controller";
import { BooksService } from "./books.service";

@Module({
  imports: [WorksModule],
  controllers: [BooksController],
  providers: [BooksService],
})
export class BooksModule {}
