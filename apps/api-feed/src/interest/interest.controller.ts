import { Body, Controller, Headers, Post } from "@nestjs/common";
import type { PostLikeResponse } from "@pk-literature/contracts";
import { InterestService } from "./interest.service";
import { PostLikeDto } from "./dto/post-like.dto";

@Controller()
export class InterestController {
  constructor(private readonly interest: InterestService) {}

  @Post("interest/like")
  async like(
    @Body() dto: PostLikeDto,
    @Headers("x-anonymous-id") anonymousId?: string,
  ): Promise<PostLikeResponse> {
    return this.interest.setLike(anonymousId, dto.bookId, dto.liked);
  }
}
