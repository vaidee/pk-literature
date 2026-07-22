import { Controller, Get, Param, Query } from "@nestjs/common";
import type { ListAuthorsResponse, GetAuthorResponse } from "@pk-literature/contracts";
import { PaginationDto } from "../common/pagination.dto";
import { paginate } from "../common/paginate";
import { AuthorsService } from "./authors.service";

@Controller("authors")
export class AuthorsController {
  constructor(private readonly authors: AuthorsService) {}

  @Get()
  async list(@Query() pagination: PaginationDto): Promise<ListAuthorsResponse> {
    const { items, totalItems } = await this.authors.list(pagination);
    return paginate(items, totalItems, pagination);
  }

  @Get(":id")
  async getById(@Param("id") id: string): Promise<GetAuthorResponse> {
    return this.authors.getById(id);
  }
}
