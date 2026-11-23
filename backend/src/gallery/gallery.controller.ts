import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GalleryService } from './gallery.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Generation Gallery')
@Controller('gallery')
export class GalleryController {
  constructor(private galleryService: GalleryService) {}

  @Get()
  @ApiOperation({ summary: 'Browse generated images and videos with filters, search, and sorting' })
  @ApiQuery({ name: 'mediaType', required: false, enum: ['ALL', 'IMAGE', 'VIDEO'] })
  @ApiQuery({ name: 'isFavourite', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['newest', 'oldest', 'views', 'downloads'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getGallery(
    @Query('mediaType') mediaType?: 'IMAGE' | 'VIDEO' | 'ALL',
    @Query('isFavourite') isFavourite?: boolean,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: 'newest' | 'oldest' | 'views' | 'downloads',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.galleryService.getGallery({
      mediaType,
      isFavourite,
      search,
      sortBy,
      page,
      limit,
    });
  }

  @Get('my-creations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user generation gallery' })
  getMyGallery(
    @CurrentUser('id') userId: string,
    @Query('mediaType') mediaType?: 'IMAGE' | 'VIDEO' | 'ALL',
    @Query('isFavourite') isFavourite?: boolean,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.galleryService.getGallery({
      userId,
      mediaType,
      isFavourite,
      search,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get generated media by ID' })
  getMediaById(@Param('id') id: string) {
    return this.galleryService.getMediaById(id);
  }

  @Post(':id/favourite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle favourite status for a media item' })
  toggleFavourite(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.galleryService.toggleFavourite(userId, id);
  }

  @Post(':id/download')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Increment download counter for analytics' })
  recordDownload(@Param('id') id: string) {
    return this.galleryService.recordDownload(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete generated media' })
  deleteMedia(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.galleryService.deleteMedia(userId, id);
  }
}
