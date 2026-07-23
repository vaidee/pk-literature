import { Controller, Get, Param } from "@nestjs/common";
import type { SimilarBooksResponse } from "@pk-literature/contracts";
import { SimilarBooksService } from "./similar-books.service";

@Controller()
export class SimilarBooksController {
  constructor(private readonly similar: SimilarBooksService) {}

  @Get("books/:id/similar")
  async similarTo(@Param("id") id: string): Promise<SimilarBooksResponse> {
    return { items: await this.similar.similarTo(id) };
  }
}
