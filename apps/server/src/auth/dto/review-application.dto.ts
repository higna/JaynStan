import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewApplicationDto {
  @IsIn(['approved', 'rejected'])
  decision!: 'approved' | 'rejected';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewNote?: string;
}
