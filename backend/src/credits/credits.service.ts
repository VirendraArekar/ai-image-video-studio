import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlanTier, SubscriptionStatus } from '@prisma/client';

export interface PurchasePackageDto {
  packageId: 'starter' | 'creator' | 'pro';
  paymentMethod?: string;
}

export interface UpgradeSubscriptionDto {
  planTier: 'STARTER' | 'CREATOR' | 'PRO_STUDIO';
}

@Injectable()
export class CreditsService {
  constructor(private prisma: PrismaService) {}

  async getUserCredits(userId: string) {
    const wallet = await this.prisma.creditWallet.findUnique({
      where: { userId },
    });

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    // Recent 5 transactions
    const recentTransactions = await this.prisma.creditTransaction.findMany({
      where: { walletId: wallet?.id },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    // Stats
    const totalImages = await this.prisma.generatedMedia.count({
      where: { userId, mediaType: 'IMAGE', deletedAt: null },
    });

    const totalVideos = await this.prisma.generatedMedia.count({
      where: { userId, mediaType: 'VIDEO', deletedAt: null },
    });

    return {
      balance: wallet?.balance || 0,
      lifetimeGranted: wallet?.lifetimeGranted || 0,
      lifetimeSpent: wallet?.lifetimeSpent || 0,
      subscription: subscription || {
        planTier: PlanTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        monthlyCredits: 50,
      },
      stats: {
        totalImages,
        totalVideos,
        totalGenerations: totalImages + totalVideos,
      },
      recentTransactions,
    };
  }

  async getTransactions(userId: string, page = 1, limit = 20) {
    const wallet = await this.prisma.creditWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Credit wallet not found');
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.creditTransaction.findMany({
        where: { walletId: wallet.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.creditTransaction.count({
        where: { walletId: wallet.id },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async purchasePackage(userId: string, dto: PurchasePackageDto) {
    const packages: Record<string, { credits: number; priceCents: number; name: string }> = {
      starter: { credits: 200, priceCents: 1000, name: 'Starter Pack (200 Credits)' },
      creator: { credits: 600, priceCents: 2500, name: 'Creator Pack (600 Credits)' },
      pro: { credits: 1500, priceCents: 5000, name: 'Studio Pro Pack (1,500 Credits)' },
    };

    const pkg = packages[dto.packageId];
    if (!pkg) {
      throw new BadRequestException('Invalid credit package selected');
    }

    const wallet = await this.prisma.creditWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    // Process transaction atomically
    return this.prisma.$transaction(async (tx) => {
      // 1. Record payment transaction
      const payment = await tx.paymentTransaction.create({
        data: {
          userId,
          amount: pkg.priceCents,
          currency: 'USD',
          creditsPurchased: pkg.credits,
          status: 'COMPLETED',
          paymentMethod: dto.paymentMethod || 'card_mock',
          providerTransactionId: `tx_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
          metadata: { packageName: pkg.name },
        },
      });

      // 2. Recharge wallet
      const newBalance = wallet.balance + pkg.credits;
      const updatedWallet = await tx.creditWallet.update({
        where: { userId },
        data: {
          balance: newBalance,
          lifetimeGranted: { increment: pkg.credits },
          lastRechargeAt: new Date(),
        },
      });

      // 3. Record credit transaction
      await tx.creditTransaction.create({
        data: {
          walletId: wallet.id,
          amount: pkg.credits,
          balanceAfter: newBalance,
          type: 'PACKAGE_PURCHASE',
          description: `Purchased ${pkg.name}`,
          referenceId: payment.id,
        },
      });

      return {
        success: true,
        creditsAdded: pkg.credits,
        newBalance: updatedWallet.balance,
        transactionId: payment.id,
      };
    });
  }

  async upgradeSubscription(userId: string, dto: UpgradeSubscriptionDto) {
    const tiers: Record<string, { credits: number; name: string }> = {
      STARTER: { credits: 300, name: 'Starter Plan' },
      CREATOR: { credits: 1000, name: 'Creator Plan' },
      PRO_STUDIO: { credits: 3000, name: 'Pro Studio Plan' },
    };

    const selectedTier = tiers[dto.planTier];
    if (!selectedTier) {
      throw new BadRequestException('Invalid subscription tier');
    }

    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    return this.prisma.$transaction(async (tx) => {
      const subscription = await tx.subscription.upsert({
        where: { userId },
        create: {
          userId,
          planTier: dto.planTier as PlanTier,
          status: SubscriptionStatus.ACTIVE,
          monthlyCredits: selectedTier.credits,
          currentPeriodStart: now,
          currentPeriodEnd: nextMonth,
        },
        update: {
          planTier: dto.planTier as PlanTier,
          status: SubscriptionStatus.ACTIVE,
          monthlyCredits: selectedTier.credits,
          currentPeriodStart: now,
          currentPeriodEnd: nextMonth,
        },
      });

      const wallet = await tx.creditWallet.findUnique({ where: { userId } });
      if (wallet) {
        const newBalance = wallet.balance + selectedTier.credits;
        await tx.creditWallet.update({
          where: { userId },
          data: {
            balance: newBalance,
            lifetimeGranted: { increment: selectedTier.credits },
            lastRechargeAt: now,
          },
        });

        await tx.creditTransaction.create({
          data: {
            walletId: wallet.id,
            amount: selectedTier.credits,
            balanceAfter: newBalance,
            type: 'SUBSCRIPTION_RECHARGE',
            description: `Monthly credit allowance for ${selectedTier.name}`,
          },
        });
      }

      return {
        success: true,
        subscription,
        message: `Successfully upgraded to ${selectedTier.name}`,
      };
    });
  }
}
