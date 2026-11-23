import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StudioService, CreateVariationDto } from './studio.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Creative Studio')
@Controller('studio')
export class StudioController {
  constructor(private studioService: StudioService) {}

  @Get('asset/:id')
  @ApiOperation({ summary: 'Load an asset into Creative Studio with its parameters, version comparison, and lineage' })
  getStudioAsset(@Param('id') id: string) {
    return this.studioService.getStudioAsset(id);
  }

  @Post('variations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Generate a variation of an existing creation with adjusted prompt, style, or seed' })
  createVariation(@CurrentUser('id') userId: string, @Body() dto: CreateVariationDto) {
    return this.studioService.createVariation(userId, dto);
  }
}
