import { IsBoolean } from 'class-validator';

export class SetFeaturedWorkDto {
  @IsBoolean()
  isFeatured!: boolean;
}
