import { ArrayMaxSize, ArrayMinSize, IsArray, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class HomepageStatDto {
  @IsString() @MinLength(1) @MaxLength(40)
  key!: string;

  @IsString() @MinLength(1) @MaxLength(80)
  label!: string;

  @IsString() @MinLength(1) @MaxLength(24)
  value!: string;

  @IsString() @MaxLength(24)
  unit!: string;
}

export class UpdateHomepageStatsDto {
  @IsArray() @ArrayMinSize(4) @ArrayMaxSize(4) @ValidateNested({ each: true }) @Type(() => HomepageStatDto)
  stats!: HomepageStatDto[];
}
