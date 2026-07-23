import { Controller, Get, Query } from "@nestjs/common";
import type { AutocompleteResponse } from "@pk-literature/contracts";
import { AutocompleteService } from "./autocomplete.service";
import { AutocompleteQueryDto } from "./dto/autocomplete-query.dto";

@Controller()
export class AutocompleteController {
  constructor(private readonly autocomplete: AutocompleteService) {}

  @Get("autocomplete")
  async search(@Query() dto: AutocompleteQueryDto): Promise<AutocompleteResponse> {
    const results = await this.autocomplete.search(dto.q);
    return { results };
  }
}
