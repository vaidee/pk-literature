import { Controller, Get, Param, Query } from "@nestjs/common";
import type { ListPublishersResponse, GetPublisherResponse } from "@pk-literature/contracts";
import { PaginationDto } from "../common/pagination.dto";
import { paginate } from "../common/paginate";
import { PublishersService } from "./publishers.service";

// SPEC-02 API surface — read-only, no auth (public catalog data).
@Controller("publishers")
export class PublishersController {
  constructor(private readonly publishers: PublishersService) {}

  @Get()
  async list(@Query() pagination: PaginationDto): Promise<ListPublishersResponse> {
    const { items, totalItems } = await this.publishers.list(pagination);
    return paginate(items, totalItems, pagination);
  }

  @Get(":id")
  async getById(@Param("id") id: string): Promise<GetPublisherResponse> {
    return this.publishers.getById(id);
  }
}
