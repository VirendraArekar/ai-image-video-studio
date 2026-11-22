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
import { VideosService } from './videos.service';
import { GenerateVideoDto } from './dto/generate-video.dto';
import { EstimateVideoCostDto } from './dto/estimate-video-cost.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('AI Video Generator')
@Controller('videos')
export class VideosController {
  constructor(private videosService: VideosService) {}

  @Get('models')
  @ApiOperation({ summary: 'List available video generation models, resolutions, and durations' })
  getModels() {
    return this.videosService.getAvailableModels();
  }

  @Post('estimate-cost')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Estimate required credits for a video generation before submitting' })
  estimateCost(@Body() dto: EstimateVideoCostDto) {
    return this.videosService.estimateCost(dto);
  }

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Queue asynchronous video generation job (Text-to-Video, Image-to-Video, Keyframes, Extension)',
  })
  @ApiResponse({ status: 202, description: 'Job queued successfully' })
  @ApiResponse({ status: 400, description: 'Insufficient credits or invalid parameters' })
  generateVideo(@CurrentUser('id') userId: string, @Body() dto: GenerateVideoDto) {
    return this.videosService.startVideoGeneration(userId, dto);
  }

  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Track asynchronous video generation job status and progress' })
  getJobStatus(@Param('jobId') jobId: string) {
    return this.videosService.getJobStatus(jobId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get generated video details and streamable MP4 URL by ID' })
  getVideoById(@Param('id') id: string) {
    return this.videosService.getVideoById(id);
  }
}
