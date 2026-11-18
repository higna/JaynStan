import { ArrayMaxSize, ArrayUnique, IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PROVIDER_CATEGORIES, type ProviderCategory } from '../provider-categories.js';

export class UpdateProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  fullName!: string;

  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(PROVIDER_CATEGORIES.length)
  @IsIn(PROVIDER_CATEGORIES, { each: true })
  disciplines!: ProviderCategory[];

  @IsOptional()
  @IsString()
  @MaxLength(128)
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword?: string;
}
