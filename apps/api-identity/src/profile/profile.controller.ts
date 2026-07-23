import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import type { GetProfileResponse, UpdateProfileResponse } from "@pk-literature/contracts";
import { ProfileService } from "./profile.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUserId } from "../common/current-user-id.decorator";

// SPEC-07 "Authorization: Authenticated APIs — Orders, Profile, Address
// Book" — every route here requires a valid access token.
@Controller("profile")
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Get()
  async get(@CurrentUserId() userId: string): Promise<GetProfileResponse> {
    return this.profile.getById(userId);
  }

  @Patch()
  async update(@CurrentUserId() userId: string, @Body() dto: UpdateProfileDto): Promise<UpdateProfileResponse> {
    return this.profile.update(userId, dto);
  }
}
