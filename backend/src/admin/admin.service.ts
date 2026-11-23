import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserStatus, JobStatus } from '@prisma/client';

export interface AdjustCreditsDto {
  amount: number;
  reason: string;
}

export interface UpdateUserStatusDto {
  status: UserStatus;
  reason?: string;
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getAnalytics() {
    const totalUsers = await this.prisma.user.count();
    const totalImages = await this.prisma.generatedMedia.count({
      where: { mediaType: 'IMAGE', deletedAt: null },
    });
    const totalVideos = await this.prisma.generatedMedia.count({
      where: { mediaType: 'VIDEO', deletedAt: null },
    });
    const totalJobs = await this.prisma.generationJob.count();
    const failedJobs = await this.prisma.generationJob.count({
      where: { status: JobStatus.FAILED },
    });
    const activeJobs = await this.prisma.generationJob.count({
      where: { status: { in: [JobStatus.PENDING, JobStatus.PROCESSING] } },
    });

    const successRate = totalJobs > 0 ? (((totalJobs - failedJobs) / totalJobs) * 100).toFixed(1) : '100.0';

    // Total credits consumed
    const creditsSpentSum = await this.prisma.creditWallet.aggregate({
      _sum: { lifetimeSpent: true },
    });

    // Recent 5 failed jobs for quick action
    const recentFailures = await this.prisma.generationJob.findMany({
      where: { status: JobStatus.FAILED },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    return {
      overview: {
        totalUsers,
        totalImages,
        totalVideos,
        totalGenerations: totalImages + totalVideos,
        totalCreditsConsumed: creditsSpentSum._sum.lifetimeSpent || 0,
        activeJobs,
        failedJobs,
        successRate: `${successRate}%`,
      },
      recentFailures,
    };
  }

  async getUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: true,
          subscription: true,
          _count: {
            select: {
              media: true,
              jobs: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => {
        const { passwordHash, refreshTokenHash, ...safeUser } = u;
        return safeUser;
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async adjustUserCredits(adminId: string, targetUserId: string, dto: AdjustCreditsDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: { wallet: true },
    });

    if (!user || !user.wallet) {
      throw new NotFoundException('Target user or wallet not found');
    }

    const newBalance = user.wallet.balance + dto.amount;

    return this.prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.creditWallet.update({
        where: { id: user.wallet!.id },
        data: {
          balance: newBalance,
          lifetimeGranted: dto.amount > 0 ? { increment: dto.amount } : undefined,
        },
      });

      await tx.creditTransaction.create({
        data: {
          walletId: user.wallet!.id,
          amount: dto.amount,
          balanceAfter: newBalance,
          type: 'ADMIN_ADJUSTMENT',
          description: `Admin manual adjustment: ${dto.reason}`,
          metadata: { adminId },
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: adminId,
          action: 'CREDIT_ADJUSTMENT',
          targetType: 'USER',
          targetId: targetUserId,
          details: { amount: dto.amount, reason: dto.reason, newBalance },
        },
      });

      return {
        success: true,
        newBalance: updatedWallet.balance,
        message: `Adjusted user credits by ${dto.amount}`,
      };
    });
  }

  async updateUserStatus(adminId: string, targetUserId: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { status: dto.status },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'USER_STATUS_UPDATE',
        targetType: 'USER',
        targetId: targetUserId,
        details: { oldStatus: user.status, newStatus: dto.status, reason: dto.reason },
      },
    });

    return { success: true, status: updated.status };
  }

  async getJobs(page = 1, limit = 20, status?: JobStatus) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [jobs, total] = await Promise.all([
      this.prisma.generationJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, name: true } },
          generatedMedia: true,
        },
      }),
      this.prisma.generationJob.count({ where }),
    ]);

    return {
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAuditLogs(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { email: true, name: true } },
        },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
