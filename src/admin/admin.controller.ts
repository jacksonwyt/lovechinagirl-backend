// admin.controller.ts
import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from './jwt-auth.guard';


@Controller('admin')
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

  @Get('verify')
  @UseGuards(JwtAuthGuard)
  async verifyToken() {
    return { valid: true };
  }
}