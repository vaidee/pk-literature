import { Controller, Get, Query } from "@nestjs/common";
import type { ListCollectionsResponse } from "@pk-literature/contracts";
import { PaginationDto } from "../common/pagination.dto";
import { paginate } from "../common/paginate";
import { CollectionsService } from "./collections.service";

@Controller("collections")
export class CollectionsController {
  constructor(private readonly collections: CollectionsService) {}

  @Get()
  async list(@Query() pagination: PaginationDto): Promise<ListCollectionsResponse> {
    const { items, totalItems } = await this.collections.list(pagination);
    return paginate(items, totalItems, pagination);
  }
}
