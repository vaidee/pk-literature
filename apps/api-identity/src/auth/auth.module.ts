import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { PasswordService } from "./password.service";
import { JwtTokenService } from "./jwt.service";
import { SessionService } from "./session.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { EventBridgeService } from "../common/eventbridge.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, PasswordService, JwtTokenService, SessionService, JwtAuthGuard, EventBridgeService],
  // JwtTokenService/JwtAuthGuard are needed by profile.module.ts and
  // addresses.module.ts to protect their routes — SessionService stays
  // internal to auth (nothing outside this module needs to touch a
  // refresh-token session directly).
  exports: [JwtTokenService, JwtAuthGuard],
})
export class AuthModule {}
