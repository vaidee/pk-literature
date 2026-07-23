import { Controller, Get, Headers, Param, Query } from "@nestjs/common";
import type { GetOrderResponse, ListOrdersResponse } from "@pk-literature/contracts";
import { OrdersService } from "./orders.service";
import { PaginationDto } from "../common/pagination.dto";
import { paginate } from "../common/paginate";

@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  async list(
    @Query() pagination: PaginationDto,
    @Headers("x-anonymous-id") anonymousId?: string,
  ): Promise<ListOrdersResponse> {
    const { items, totalItems } = await this.orders.list(anonymousId, pagination);
    return paginate(items, totalItems, pagination);
  }

  @Get(":id")
  async getById(@Param("id") id: string): Promise<GetOrderResponse> {
    return this.orders.getById(id);
  }
}
