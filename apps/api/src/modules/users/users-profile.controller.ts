import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users/me')
@UseGuards(JwtAuthGuard)
@Roles(Role.STUDENT)
export class UsersProfileController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  async getMyProfile(@Req() req: Request) {
    const user = req.user as any;
    return this.usersService.getMyProfile(user.id);
  }

  @Patch('profile')
  async updateMyProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const user = req.user as any;
    return this.usersService.updateMyProfile(user.id, dto);
  }
}
