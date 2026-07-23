import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @IsEmail()
  email!: string;

  // SPEC-07 Security: "Passwordless-ready architecture" is about the
  // schema (users.password_hash is nullable), not about making
  // password optional on today's only registration path — a caller
  // hitting this endpoint is choosing the email+password method.
  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(1)
  displayName!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
