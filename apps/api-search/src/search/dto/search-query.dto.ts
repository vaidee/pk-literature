import { IsIn, IsOptional, IsString, IsUUID, MinLength } from "class-validator";
import { PaginationDto } from "../../common/pagination.dto";

// SPEC-08 §25: Empty Query -> 400, Invalid Query -> 400. MinLength(1)
// plus PaginationDto's existing validation covers both via the global
// ValidationPipe (create-app.ts) — no custom exception needed here.
export class SearchQueryDto extends PaginationDto {
  @IsString()
  @MinLength(1)
  q!: string;

  @IsOptional()
  @IsUUID()
  publisherId?: string;

  @IsOptional()
  @IsUUID()
  authorId?: string;

  @IsOptional()
  @IsUUID()
  themeId?: string;

  @IsOptional()
  @IsUUID()
  genreId?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsIn(["in_stock", "out_of_stock", "preorder", "discontinued"])
  availability?: string;
}
