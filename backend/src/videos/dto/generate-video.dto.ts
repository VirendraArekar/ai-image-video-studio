import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsIn, IsNumber, Min, Max, IsBoolean } from 'class-validator';

export class GenerateVideoDto {
  @ApiProperty({ example: 'A soaring cinematic drone shot over a misty cybernetic mountain valley at sunrise' })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiPropertyOptional({ example: 'qwen-wan2.1-video-turbo', default: 'qwen-wan2.1-video-turbo' })
  @IsString()
  @IsOptional()
  modelId?: string;

  @ApiPropertyOptional({ example: '16:9', enum: ['16:9', '9:16'], default: '16:9' })
  @IsString()
  @IsOptional()
  @IsIn(['16:9', '9:16'])
  aspectRatio?: '16:9' | '9:16';

  @ApiPropertyOptional({ example: 10, default: 10, description: 'Duration in seconds (3 to 15)' })
  @IsNumber()
  @IsOptional()
  @Min(3)
  @Max(15)
  duration?: number;

  @ApiPropertyOptional({ example: '720p', enum: ['360p', '720p', '1080p', '4k'], default: '720p' })
  @IsString()
  @IsOptional()
  @IsIn(['360p', '720p', '1080p', '4k'])
  resolution?: '360p' | '720p' | '1080p' | '4k';

  @ApiPropertyOptional({ description: 'Base64 image for first-frame or image-to-video' })
  @IsString()
  @IsOptional()
  firstFrameBase64?: string;

  @ApiPropertyOptional({ example: 'image/png' })
  @IsString()
  @IsOptional()
  firstFrameMime?: string;

  @ApiPropertyOptional({ description: 'Base64 image for last-frame keyframe transition' })
  @IsString()
  @IsOptional()
  lastFrameBase64?: string;

  @ApiPropertyOptional({ example: 'image/png' })
  @IsString()
  @IsOptional()
  lastFrameMime?: string;

  @ApiPropertyOptional({ description: 'Base64 reference image to guide style or character' })
  @IsString()
  @IsOptional()
  referenceImageBase64?: string;

  @ApiPropertyOptional({ example: 'image/png' })
  @IsString()
  @IsOptional()
  referenceImageMime?: string;

  @ApiPropertyOptional({ description: 'Previous interaction ID for conversational extension or editing' })
  @IsString()
  @IsOptional()
  previousInteractionId?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  includeAudio?: boolean;
}
