import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role, UserStatus, PlanTier, SubscriptionStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    // Initial trial balance
    const INITIAL_TRIAL_CREDITS = 50;
    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        role: Role.USER,
        status: UserStatus.ACTIVE,
        avatarUrl:
          dto.avatarUrl ||
          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(dto.name)}`,
        profile: {
          create: {
            bio: 'Creative visual explorer on AI Image & Video Studio',
            defaultImageModel: 'qwen-2.5-image-turbo',
            defaultVideoModel: 'qwen-wan2.1-video-turbo',
          },
        },
        wallet: {
          create: {
            balance: INITIAL_TRIAL_CREDITS,
            lifetimeGranted: INITIAL_TRIAL_CREDITS,
            lifetimeSpent: 0,
            lastRechargeAt: now,
            transactions: {
              create: {
                amount: INITIAL_TRIAL_CREDITS,
                balanceAfter: INITIAL_TRIAL_CREDITS,
                type: 'SIGNUP_BONUS',
                description: 'Welcome gift: 50 Free Trial Generation Credits',
              },
            },
          },
        },
        subscription: {
          create: {
            planTier: PlanTier.FREE,
            status: SubscriptionStatus.ACTIVE,
            monthlyCredits: INITIAL_TRIAL_CREDITS,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
          },
        },
      },
      include: {
        wallet: true,
        subscription: true,
        profile: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    this.logger.log(`New user registered: ${user.email} (${user.id})`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        wallet: user.wallet,
        subscription: user.subscription,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        wallet: true,
        subscription: true,
        profile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account has been suspended or deactivated');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        wallet: user.wallet,
        subscription: user.subscription,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const refreshSecret = process.env.JWT_REFRESH_SECRET || 'studio-super-secret-refresh-key-32';
      const payload = this.jwtService.verify(refreshToken, {
        secret: refreshSecret,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          wallet: true,
          subscription: true,
        },
      });

      if (!user || !user.refreshTokenHash) {
        throw new UnauthorizedException('Access Denied');
      }

      const isTokenMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!isTokenMatch) {
        throw new UnauthorizedException('Invalid Refresh Token');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);
      await this.updateRefreshToken(user.id, tokens.refreshToken);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl,
          wallet: user.wallet,
          subscription: user.subscription,
        },
        ...tokens,
      };
    } catch (err) {
      throw new UnauthorizedException('Expired or invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
    return { success: true, message: 'Logged out successfully' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        subscription: true,
        profile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { passwordHash, refreshTokenHash, ...result } = user;
    return result;
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessSecret = process.env.JWT_SECRET || 'studio-super-secret-jwt-key-32chars';
    const refreshSecret = process.env.JWT_REFRESH_SECRET || 'studio-super-secret-refresh-key-32';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: '1h',
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(refreshToken, salt);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }
}
