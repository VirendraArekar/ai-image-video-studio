import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsIn, IsNumber, Min, Max } from 'class-validator';

export class GenerateImageDto {
  @ApiProperty({ example: 'A cinematic portrait of a cybernetic wanderer in neon-lit Tokyo rain' })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiPropertyOptional({ example: 'blurry, low quality, oversaturated' })
  @IsString()
  @IsOptional()
  negativePrompt?: string;

  @ApiPropertyOptional({ example: 'qwen-2.5-image-turbo', default: 'qwen-2.5-image-turbo' })
  @IsString()
  @IsOptional()
  modelId?: string;

  @ApiPropertyOptional({ example: '1:1', enum: ['1:1', '4:5', '3:2', '16:9', '9:16'], default: '1:1' })
  @IsString()
  @IsOptional()
  @IsIn(['1:1', '4:5', '3:2', '16:9', '9:16'])
  aspectRatio?: '1:1' | '4:5' | '3:2' | '16:9' | '9:16';

  @ApiPropertyOptional({ example: 'Cinematic', default: 'Cinematic' })
  @IsString()
  @IsOptional()
  stylePreset?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(4)
  sampleCount?: number;

  @ApiPropertyOptional({ description: 'Base64 string of reference image for Image-to-Image' })
  @IsString()
  @IsOptional()
  referenceImageBase64?: string;

  @ApiPropertyOptional({ example: 'image/png' })
  @IsString()
  @IsOptional()
  referenceImageMime?: string;

  @ApiPropertyOptional({
    enum: ['GENERATE', 'EDIT', 'REPLACE_BG', 'REMOVE_BG', 'ENHANCE'],
    default: 'GENERATE',
  })
  @IsString()
  @IsOptional()
  editAction?: 'GENERATE' | 'EDIT' | 'REPLACE_BG' | 'REMOVE_BG' | 'ENHANCE';

  @ApiPropertyOptional({ example: 42 })
  @IsNumber()
  @IsOptional()
  seed?: number;
}
