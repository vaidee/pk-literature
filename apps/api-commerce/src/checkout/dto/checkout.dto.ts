import { Type } from "class-transformer";
import { IsEmail, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";

export class AddressDto {
  @IsString()
  @MinLength(1)
  recipientName!: string;

  @IsString()
  @MinLength(1)
  line1!: string;

  @IsOptional()
  @IsString()
  line2: string | null = null;

  @IsString()
  @MinLength(1)
  city!: string;

  @IsString()
  @MinLength(1)
  state!: string;

  @IsString()
  @MinLength(1)
  postalCode!: string;

  @IsString()
  country: string = "IN";

  @IsString()
  @MinLength(1)
  phone!: string;
}

export class CheckoutDto {
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress!: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  billingAddress?: AddressDto;

  @IsEmail()
  contactEmail!: string;

  @IsString()
  @MinLength(1)
  contactPhone!: string;
}
