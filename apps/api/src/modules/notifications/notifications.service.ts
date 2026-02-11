import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(userId: string, dto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: {
        userId,
        type: dto.type,
        content: dto.content,
      },
    });
  }

  async listNotifications(unreadOnly: boolean) {
    return this.prisma.notification.findMany({
      where: unreadOnly ? { read: false } : undefined,
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listForStudent(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async unreadCount() {
    return this.prisma.notification.count({ where: { read: false } });
  }

  async markRead(id: string) {
    const existing = await this.prisma.notification.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id },
      data: { read: true },
    });
  }

  async reply(id: string, response: string) {
    const existing = await this.prisma.notification.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id },
      data: {
        response,
        respondedAt: new Date(),
        read: true,
      },
    });
  }
}
