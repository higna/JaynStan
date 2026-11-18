import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsIn, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';

export class SocialLinkDto {
  @IsIn(['facebook', 'whatsapp', 'twitter'])
  platform!: 'facebook' | 'whatsapp' | 'twitter';

  @IsOptional() @Transform(({ value }) => value === '' ? null : value) @IsString()
  @IsUrl({ protocols: ['https'], require_protocol: true }, { message: 'Social links must use https URLs.' })
  url?: string | null;

  @IsBoolean()
  enabled!: boolean;
}

export class UpdateSocialLinksDto {
  @IsArray() @ArrayMinSize(3) @ArrayMaxSize(3) @ValidateNested({ each: true }) @Type(() => SocialLinkDto)
  links!: SocialLinkDto[];
}
