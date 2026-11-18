import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateAccountDto {
  @IsString() @MinLength(2) @MaxLength(160)
  fullName!: string;

  @IsEmail() @MaxLength(320)
  email!: string;

  @IsOptional() @IsIn(['user', 'admin'])
  role?: 'user' | 'admin';
}
