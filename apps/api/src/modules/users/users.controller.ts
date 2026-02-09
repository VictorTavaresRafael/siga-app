import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('students')
  async listStudents() {
    return this.usersService.findStudents();
  }

  @Post()
  async createStudent(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  async updateStudent(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateStudent(id, dto);
  }

  @Get('students/:id/profile')
  async getStudentProfile(@Param('id') id: string) {
    return this.usersService.getStudentProfile(id);
  }

  @Delete(':id')
  async deactivateStudent(@Param('id') id: string) {
    return this.usersService.deactivateStudent(id);
  }
}
