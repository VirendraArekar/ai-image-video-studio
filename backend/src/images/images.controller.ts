import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ImagesService } from './images.service';
import { GenerateImageDto } from './dto/generate-image.dto';
import { EditImageDto } from './dto/edit-image.dto';
import { EnhancePromptDto } from './dto/enhance-prompt.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('AI Image Generator')
@Controller('images')
export class ImagesController {
  constructor(private imagesService: ImagesService) {}

  @Get('models')
  @ApiOperation({ summary: 'List available image generation models and capabilities' })
  getModels() {
    return this.imagesService.getAvailableModels();
  }

  @Post('enhance-prompt')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enhance a short prompt into a high-detail creative visual prompt using Gemini' })
  enhancePrompt(@Body() dto: EnhancePromptDto) {
    return this.imagesService.enhancePrompt(dto);
  }

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a new AI image using Gemini models (text-to-image or image-to-image)' })
  @ApiResponse({ status: 201, description: 'Image successfully generated' })
  @ApiResponse({ status: 400, description: 'Insufficient credits or invalid parameters' })
  generateImage(@CurrentUser('id') userId: string, @Body() dto: GenerateImageDto) {
    return this.imagesService.generateImage(userId, dto);
  }

  @Post('edit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Edit an existing image (conversational editing, background replace, object edit)' })
  editImage(@CurrentUser('id') userId: string, @Body() dto: EditImageDto) {
    return this.imagesService.editImage(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get generated image details, prompt, and parameters by ID' })
  getImageById(@Param('id') id: string) {
    return this.imagesService.getImageById(id);
  }
}
