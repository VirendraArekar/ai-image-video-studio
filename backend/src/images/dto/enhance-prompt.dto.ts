import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';

export class EnhancePromptDto {
  @ApiProperty({ example: 'futuristic sports car in rain' })
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @ApiPropertyOptional({ enum: ['IMAGE', 'VIDEO'], default: 'IMAGE' })
  @IsString()
  @IsOptional()
  @IsIn(['IMAGE', 'VIDEO'])
  targetType?: 'IMAGE' | 'VIDEO';

  @ApiPropertyOptional({ example: 'Cinematic' })
  @IsString()
  @IsOptional()
  styleHint?: string;
}
