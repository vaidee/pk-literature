import { IsBoolean, IsOptional, IsString, Length, MinLength } from "class-validator";

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  recipientName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  line1?: string;

  @IsOptional()
  @IsString()
  line2?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  city?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  state?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  country?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
