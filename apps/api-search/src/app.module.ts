import { Module } from "@nestjs/common";
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health/health.controller";
import { SearchModule } from "./search/search.module";
import { AutocompleteModule } from "./autocomplete/autocomplete.module";
import { BrowseModule } from "./browse/browse.module";

// SPEC-08's Search & Discovery Engine — public, unauthenticated
// (SPEC-16), read-only end to end (SPEC-08 §3 Non Goals: "Search
// SHALL NOT ... Own catalog ... Modify books ...").
@Module({
  imports: [DatabaseModule, SearchModule, AutocompleteModule, BrowseModule],
  controllers: [HealthController],
})
export class AppModule {}
