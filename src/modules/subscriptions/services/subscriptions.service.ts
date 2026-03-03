import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { EnrollmentStatus } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private prisma: PrismaService) {}

  // Run daily at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkAndExpireSubscriptions() {
    this.logger.log('Running daily subscription expiration check...');

    try {
      const now = new Date();

      // Find and update expired subscriptions
      const result = await this.prisma.enrollment.updateMany({
        where: {
          status: EnrollmentStatus.ACTIVE,
          subscriptionEnd: {
            lt: now,
          },
        },
        data: {
          status: EnrollmentStatus.EXPIRED,
        },
      });

      if (result.count > 0) {
        this.logger.log(`Expired ${result.count} subscription(s)`);
      } else {
        this.logger.log('No subscriptions to expire');
      }

      return { expiredCount: result.count };
    } catch (error) {
      this.logger.error('Error checking subscriptions:', error);
      throw error;
    }
  }
}
