import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (err: any) {
      // don't crash the app at bootstrap if the database isn't available yet
      // this allows the server to start and surface DB errors when routes are used
      // eslint-disable-next-line no-console
      console.warn('Prisma connect warning:', err?.message ?? err);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
