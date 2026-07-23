import { IsBoolean, IsOptional, IsString, Length, MinLength } from "class-validator";

export class CreateAddressDto {
  @IsString()
  @MinLength(1)
  recipientName!: string;

  @IsString()
  @MinLength(1)
  line1!: string;

  @IsOptional()
  @IsString()
  line2?: string | null;

  @IsString()
  @MinLength(1)
  city!: string;

  @IsString()
  @MinLength(1)
  state!: string;

  @IsString()
  @MinLength(1)
  postalCode!: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;

  @IsString()
  @MinLength(1)
  phone!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
