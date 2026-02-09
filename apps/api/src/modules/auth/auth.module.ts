import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';
import { RolesGuard } from './roles.guard';
import { APP_GUARD } from '@nestjs/core';
import { getJwtSecret } from './jwt-secret';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: getJwtSecret(),
      signOptions: { expiresIn: '1h' },
    }),
    UsersModule,
  ],
  providers: [AuthService, JwtStrategy, { provide: APP_GUARD, useClass: RolesGuard }],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
