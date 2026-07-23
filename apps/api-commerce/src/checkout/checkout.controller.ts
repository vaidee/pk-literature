import { Body, Controller, Headers, Post } from "@nestjs/common";
import type { CheckoutResponse } from "@pk-literature/contracts";
import { CheckoutService } from "./checkout.service";
import { CheckoutDto } from "./dto/checkout.dto";

@Controller("checkout")
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  async checkout(
    @Body() dto: CheckoutDto,
    @Headers("x-anonymous-id") anonymousId?: string,
  ): Promise<CheckoutResponse> {
    return this.checkoutService.checkout(anonymousId, dto);
  }
}
