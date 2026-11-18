import { IsDateString, IsIn, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';
import { PROVIDER_CATEGORIES, type ProviderCategory } from '../../auth/provider-categories.js';

export class CreateFeaturedWorkDto {
  @IsString() @MinLength(2) @MaxLength(180)
  title!: string;

  @IsIn(PROVIDER_CATEGORIES)
  category!: ProviderCategory;

  @IsString() @MinLength(10) @MaxLength(3000)
  description!: string;

  @IsUrl({ protocols: ['https'], require_protocol: true }) @MaxLength(2048)
  imageUrl!: string;

  @IsOptional() @IsUrl({ protocols: ['https'], require_protocol: true }) @MaxLength(2048)
  workUrl?: string;

  @IsOptional() @IsIn(['project', 'website', 'pdf', 'video', 'writing', 'event', 'class'])
  contentType?: 'project' | 'website' | 'pdf' | 'video' | 'writing' | 'event' | 'class';

  @IsOptional() @IsString() @MaxLength(12000)
  body?: string;

  @IsOptional() @IsString() @MaxLength(120)
  offer?: string;

  @IsOptional() @IsDateString()
  startsAt?: string;

  @IsOptional() @IsDateString()
  endsAt?: string;
}
