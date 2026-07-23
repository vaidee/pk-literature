import { IsInt, IsUUID, Min } from "class-validator";

export class UpsertCartItemDto {
  @IsUUID()
  bookId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}
