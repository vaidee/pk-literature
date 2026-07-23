import { IsString } from "class-validator";

export class AutocompleteQueryDto {
  @IsString()
  q!: string;
}
