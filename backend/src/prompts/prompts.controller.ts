import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PromptsService, CreatePromptDto } from './prompts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Prompt Library')
@Controller('prompts')
export class PromptsController {
  constructor(private promptsService: PromptsService) {}

  @Get('categories')
  @ApiOperation({ summary: 'Get all prompt library categories' })
  getCategories() {
    return this.promptsService.getCategories();
  }

  @Get()
  @ApiOperation({ summary: 'Get searchable prompt templates filtered by category' })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  getPrompts(@Query('category') category?: string, @Query('search') search?: string) {
    return this.promptsService.getPrompts(category, search);
  }

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Save a custom prompt template' })
  createPrompt(@CurrentUser('id') userId: string | null, @Body() dto: CreatePromptDto) {
    return this.promptsService.createPrompt(userId || undefined, dto);
  }

  @Post(':id/use')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record usage of a prompt template' })
  usePrompt(@Param('id') id: string) {
    return this.promptsService.incrementUsage(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete user custom prompt template' })
  deletePrompt(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.promptsService.deletePrompt(userId, id);
  }
}
