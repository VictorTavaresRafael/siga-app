import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersController } from './users.controller';
import { UsersProfileController } from './users-profile.controller';

@Module({
  providers: [UsersService, PrismaService],
  controllers: [UsersController, UsersProfileController],
  exports: [UsersService],
})
export class UsersModule {}
