import { Body, Controller, Param, Post } from "@nestjs/common";
import { StagingBooksService } from "./staging-books.service";
import { SubmitStagingBookDto } from "./dto/submit-staging-book.dto";

@Controller()
export class StagingBooksController {
  constructor(private readonly stagingBooks: StagingBooksService) {}

  @Post("import-runs/:runId/books")
  async submit(@Param("runId") runId: string, @Body() dto: SubmitStagingBookDto) {
    return this.stagingBooks.submit(runId, dto);
  }
}
