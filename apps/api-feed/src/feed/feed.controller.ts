import { Controller, Get, Headers, Param, Query } from "@nestjs/common";
import type { GetFeedResponse, GetShelfResponse } from "@pk-literature/contracts";
import { FeedService } from "./feed.service";
import { GetShelfDto } from "./dto/get-shelf.dto";

// SPEC-16: Discovery reads are public — no auth on this controller.
// `X-Anonymous-Id` is optional everywhere here: an unrecognized/absent
// value just means no personalized shelf is shown, never an error (SPEC-05:
// "Feed remains usable for first-time visitors").
@Controller()
export class FeedController {
  constructor(private readonly feed: FeedService) {}

  @Get("feed")
  async getFeed(@Headers("x-anonymous-id") anonymousId?: string): Promise<GetFeedResponse> {
    return this.feed.getFeed(anonymousId ?? null);
  }

  @Get("feed/shelf/:id")
  async getShelf(
    @Param("id") id: string,
    @Query() pagination: GetShelfDto,
    @Headers("x-anonymous-id") anonymousId?: string,
  ): Promise<GetShelfResponse> {
    const { items, hasMore } = await this.feed.getShelfPage(
      id,
      anonymousId ?? null,
      pagination.pageSize,
      pagination.offset,
    );
    return { items, hasMore };
  }
}
