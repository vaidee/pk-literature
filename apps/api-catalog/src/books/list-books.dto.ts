import { IsOptional, IsUUID } from "class-validator";
import { PaginationDto } from "../common/pagination.dto";

export class ListBooksDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  workId?: string;

  @IsOptional()
  @IsUUID()
  publisherId?: string;
}
