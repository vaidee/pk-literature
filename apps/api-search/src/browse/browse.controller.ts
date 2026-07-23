import { Controller, Get, Query } from "@nestjs/common";
import type { BrowseResponse } from "@pk-literature/contracts";
import { BrowseService } from "./browse.service";
import { PaginationDto } from "../common/pagination.dto";

@Controller("browse")
export class BrowseController {
  constructor(private readonly browse: BrowseService) {}

  @Get("publishers")
  async publishers(@Query() pagination: PaginationDto): Promise<BrowseResponse> {
    return { items: await this.browse.publishers(pagination) };
  }

  @Get("authors")
  async authors(@Query() pagination: PaginationDto): Promise<BrowseResponse> {
    return { items: await this.browse.authors(pagination) };
  }

  @Get("themes")
  async themes(@Query() pagination: PaginationDto): Promise<BrowseResponse> {
    return { items: await this.browse.themes(pagination) };
  }

  @Get("collections")
  async collections(@Query() pagination: PaginationDto): Promise<BrowseResponse> {
    return { items: await this.browse.collections(pagination) };
  }
}
