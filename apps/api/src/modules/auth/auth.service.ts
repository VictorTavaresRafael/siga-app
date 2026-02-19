import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) {}

  private async comparePassword(plainText: string, hashed: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainText, hashed);
    } catch {
      // Legacy/corrupted hashes should not crash login route.
      return false;
    }
  }

  async signup(dto: RegisterDto) {
    // delegate user creation to UsersService (which hashes password)
    const user = await this.usersService.create(dto as any);
    return user;
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    const match = await this.comparePassword(password, user.password);
    if (!match) return null;

    // strip password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _pw, ...rest } = user as any;
    return rest;
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (!user.isActive) throw new UnauthorizedException('Invalid credentials');

    const valid = await this.comparePassword(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email, role: user.role };
    return { access_token: this.jwtService.sign(payload) };
  }
}
