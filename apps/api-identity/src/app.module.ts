import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health/health.controller";
import { AuthModule } from "./auth/auth.module";
import { ProfileModule } from "./profile/profile.module";
import { AddressesModule } from "./addresses/addresses.module";

@Module({
  imports: [DatabaseModule, AuthModule, ProfileModule, AddressesModule],
  controllers: [HealthController],
})
export class AppModule {}
