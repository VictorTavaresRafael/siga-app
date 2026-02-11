import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post()
  @Roles(Role.STUDENT)
  async create(@Req() req: Request, @Body() dto: CreateNotificationDto) {
    const user = req.user as any;
    return this.notificationsService.createNotification(user.id, dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  async list(@Query('unread') unread?: string) {
    const unreadOnly = unread === 'true';
    return this.notificationsService.listNotifications(unreadOnly);
  }

  @Get('me')
  @Roles(Role.STUDENT)
  async listMine(@Req() req: Request) {
    const user = req.user as any;
    return this.notificationsService.listForStudent(user.id);
  }

  @Get('unread-count')
  @Roles(Role.ADMIN)
  async unreadCount() {
    return { count: await this.notificationsService.unreadCount() };
  }

  @Patch(':id/read')
  @Roles(Role.ADMIN)
  async markRead(@Param('id') id: string) {
    return this.notificationsService.markRead(id);
  }

  @Patch(':id/reply')
  @Roles(Role.ADMIN)
  async reply(@Param('id') id: string, @Body() body: { response?: string }) {
    return this.notificationsService.reply(id, body.response ?? '');
  }
}
