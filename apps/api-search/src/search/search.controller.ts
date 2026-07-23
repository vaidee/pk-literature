import { Controller, Get, Headers, Query } from "@nestjs/common";
import type { SearchResponse } from "@pk-literature/contracts";
import { SearchService } from "./search.service";
import { SearchQueryDto } from "./dto/search-query.dto";

// SPEC-16: Discovery reads are public — no auth.
@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get("search")
  async search(
    @Query() dto: SearchQueryDto,
    @Headers("x-anonymous-id") anonymousId?: string,
  ): Promise<SearchResponse> {
    return this.searchService.search(dto, anonymousId ?? null);
  }
}
