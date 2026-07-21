import { Controller, Get, Param, Query } from "@nestjs/common";
import type { ListWorksResponse, GetWorkResponse } from "@pk-literature/contracts";
import { PaginationDto } from "../common/pagination.dto";
import { paginate } from "../common/paginate";
import { WorksService } from "./works.service";

@Controller("works")
export class WorksController {
  constructor(private readonly works: WorksService) {}

  @Get()
  async list(@Query() pagination: PaginationDto): Promise<ListWorksResponse> {
    const { items, totalItems } = await this.works.list(pagination);
    return paginate(items, totalItems, pagination);
  }

  @Get(":id")
  async getById(@Param("id") id: string): Promise<GetWorkResponse> {
    return this.works.getById(id);
  }
}
