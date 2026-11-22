import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreditsService, PurchasePackageDto, UpgradeSubscriptionDto } from './credits.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Credits & Subscriptions')
@Controller('credits')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CreditsController {
  constructor(private creditsService: CreditsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user credit balance, usage stats, and subscription' })
  getUserCredits(@CurrentUser('id') userId: string) {
    return this.creditsService.getUserCredits(userId);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get paginated credit transaction history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getTransactions(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.creditsService.getTransactions(userId, page, limit);
  }

  @Post('packages/purchase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Purchase a credit refill package (Starter, Creator, Studio Pro)' })
  purchasePackage(@CurrentUser('id') userId: string, @Body() dto: PurchasePackageDto) {
    return this.creditsService.purchasePackage(userId, dto);
  }

  @Post('subscription/upgrade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upgrade subscription plan tier' })
  upgradeSubscription(@CurrentUser('id') userId: string, @Body() dto: UpgradeSubscriptionDto) {
    return this.creditsService.upgradeSubscription(userId, dto);
  }
}
