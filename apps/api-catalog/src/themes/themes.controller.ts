import { Controller, Get, Query } from "@nestjs/common";
import type { ListThemesResponse } from "@pk-literature/contracts";
import { PaginationDto } from "../common/pagination.dto";
import { paginate } from "../common/paginate";
import { ThemesService } from "./themes.service";

@Controller("themes")
export class ThemesController {
  constructor(private readonly themes: ThemesService) {}

  @Get()
  async list(@Query() pagination: PaginationDto): Promise<ListThemesResponse> {
    const { items, totalItems } = await this.themes.list(pagination);
    return paginate(items, totalItems, pagination);
  }
}
