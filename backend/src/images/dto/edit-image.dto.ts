import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class EditImageDto {
  @ApiProperty({ description: 'Instruction for the edit (e.g. "Add a glowing gold crown", "Replace background with Mars surface")' })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiPropertyOptional({ description: 'Base64 image to be modified' })
  @IsString()
  @IsOptional()
  referenceImageBase64?: string;

  @ApiPropertyOptional({ description: 'Alternative alias for referenceImageBase64' })
  @IsString()
  @IsOptional()
  referenceImage?: string;

  @ApiPropertyOptional({ description: 'Alternative alias for image' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({ example: 'image/png' })
  @IsString()
  @IsOptional()
  referenceImageMime?: string;

  @ApiPropertyOptional({
    enum: ['EDIT', 'REPLACE_BG', 'REMOVE_BG', 'ENHANCE'],
    default: 'EDIT',
  })
  @IsString()
  @IsOptional()
  editAction?: 'EDIT' | 'REPLACE_BG' | 'REMOVE_BG' | 'ENHANCE';

  @ApiPropertyOptional({ example: 'background_replace' })
  @IsString()
  @IsOptional()
  editType?: string;

  @ApiPropertyOptional({ example: 'qwen-2.5-image-turbo' })
  @IsString()
  @IsOptional()
  modelId?: string;

  @ApiPropertyOptional({ example: '1:1' })
  @IsString()
  @IsOptional()
  aspectRatio?: '1:1' | '4:5' | '3:2' | '16:9' | '9:16';

  @ApiPropertyOptional({ example: 'Cyberpunk' })
  @IsString()
  @IsOptional()
  stylePreset?: string;

  @ApiPropertyOptional({ example: 42 })
  @IsNumber()
  @IsOptional()
  seed?: number;
}
