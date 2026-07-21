import { Controller, Get, Query } from "@nestjs/common";
import type { ListGenresResponse } from "@pk-literature/contracts";
import { PaginationDto } from "../common/pagination.dto";
import { paginate } from "../common/paginate";
import { GenresService } from "./genres.service";

@Controller("genres")
export class GenresController {
  constructor(private readonly genres: GenresService) {}

  @Get()
  async list(@Query() pagination: PaginationDto): Promise<ListGenresResponse> {
    const { items, totalItems } = await this.genres.list(pagination);
    return paginate(items, totalItems, pagination);
  }
}
