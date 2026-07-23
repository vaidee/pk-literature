import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type {
  CreateAddressResponse,
  DeleteAddressResponse,
  ListAddressesResponse,
  UpdateAddressResponse,
} from "@pk-literature/contracts";
import { AddressesService } from "./addresses.service";
import { CreateAddressDto } from "./dto/create-address.dto";
import { UpdateAddressDto } from "./dto/update-address.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUserId } from "../common/current-user-id.decorator";

@Controller("addresses")
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  async list(@CurrentUserId() userId: string): Promise<ListAddressesResponse> {
    return this.addresses.list(userId);
  }

  @Post()
  async create(@CurrentUserId() userId: string, @Body() dto: CreateAddressDto): Promise<CreateAddressResponse> {
    return this.addresses.create(userId, dto);
  }

  @Patch(":id")
  async update(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body() dto: UpdateAddressDto,
  ): Promise<UpdateAddressResponse> {
    return this.addresses.update(userId, id, dto);
  }

  @Delete(":id")
  async remove(@CurrentUserId() userId: string, @Param("id") id: string): Promise<DeleteAddressResponse> {
    await this.addresses.remove(userId, id);
    return { deleted: true };
  }
}
