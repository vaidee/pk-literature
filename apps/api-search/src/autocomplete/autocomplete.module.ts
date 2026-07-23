import { Module } from "@nestjs/common";
import { AutocompleteController } from "./autocomplete.controller";
import { AutocompleteService } from "./autocomplete.service";

@Module({
  controllers: [AutocompleteController],
  providers: [AutocompleteService],
})
export class AutocompleteModule {}
