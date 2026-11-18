import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { PROVIDER_CATEGORIES, type ProviderCategory } from '../provider-categories.js';

export class ProviderApplicationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  fullName!: string;

  @IsString()
  @MinLength(7)
  @MaxLength(40)
  phone!: string;

  @IsIn(PROVIDER_CATEGORIES)
  category!: ProviderCategory;
}
