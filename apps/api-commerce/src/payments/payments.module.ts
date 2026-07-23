import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { RazorpayClient } from "./razorpay.client";
import { EventBridgeService } from "../common/eventbridge.service";

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, RazorpayClient, EventBridgeService],
})
export class PaymentsModule {}
