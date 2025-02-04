// admin.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(ThrottlerGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  async login(@Body() credentials: { username: string; password: string }) {
    const admin = await this.adminService.validateAdmin(
      credentials.username,
      credentials.password
    );
    return this.adminService.login(admin);
  }
}