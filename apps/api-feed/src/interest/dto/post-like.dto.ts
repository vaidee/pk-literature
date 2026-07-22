import { IsBoolean, IsUUID } from "class-validator";

export class PostLikeDto {
  @IsUUID()
  bookId!: string;

  @IsBoolean()
  liked!: boolean;
}
