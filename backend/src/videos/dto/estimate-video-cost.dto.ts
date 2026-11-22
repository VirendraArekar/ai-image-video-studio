import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsIn, Min, Max } from 'class-validator';

export class EstimateVideoCostDto {
  @ApiPropertyOptional({ example: 'qwen-wan2.1-video-turbo' })
  @IsString()
  @IsOptional()
  modelId?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsNumber()
  @IsOptional()
  @Min(3)
  @Max(15)
  duration?: number;

  @ApiPropertyOptional({ example: '720p', enum: ['360p', '720p', '1080p', '4k'] })
  @IsString()
  @IsOptional()
  @IsIn(['360p', '720p', '1080p', '4k'])
  resolution?: '360p' | '720p' | '1080p' | '4k';
}
