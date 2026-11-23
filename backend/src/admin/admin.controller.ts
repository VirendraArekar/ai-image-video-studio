import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService, AdjustCreditsDto, UpdateUserStatusDto } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role, JobStatus } from '@prisma/client';

@ApiTags('Admin Dashboard')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('analytics')
  @ApiOperation({ summary: 'Get global SaaS generation metrics, users, active jobs, and credit consumption' })
  getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('users')
  @ApiOperation({ summary: 'Search and paginate all registered platform users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  getUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(page, limit, search);
  }

  @Post('users/:id/credits')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin manual credit adjustment (bonus grant or deduction)' })
  adjustCredits(
    @CurrentUser('id') adminId: string,
    @Param('id') userId: string,
    @Body() dto: AdjustCreditsDto,
  ) {
    return this.adminService.adjustUserCredits(adminId, userId, dto);
  }

  @Post('users/:id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user account status (ACTIVE, SUSPENDED)' })
  updateUserStatus(
    @CurrentUser('id') adminId: string,
    @Param('id') userId: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.adminService.updateUserStatus(adminId, userId, dto);
  }

  @Get('jobs')
  @ApiOperation({ summary: 'Monitor generation jobs queue status and execution logs' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: JobStatus })
  getJobs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: JobStatus,
  ) {
    return this.adminService.getJobs(page, limit, status);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Inspect immutable administrative audit logs' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getAuditLogs(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getAuditLogs(page, limit);
  }
}
