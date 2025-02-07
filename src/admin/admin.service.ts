import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from './admin.entity';
import * as bcrypt from 'bcrypt';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private jwtService: JwtService,
  ) {}

  async validateAdmin(username: string, password: string) {
    const admin = await this.adminRepository.findOne({ where: { username } });
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return admin;
  }

  async login(admin: Admin) {
    const payload = { 
      username: admin.username, 
      sub: admin.id
    };
    return {
      access_token: this.jwtService.sign(payload),
      expires_in: 86400, // 24 hours in seconds
      user: { id: admin.id, username: admin.username }
    };
  }

  async createAdmin(username: string, password: string) {
    const existingAdmin = await this.adminRepository.findOne({ 
      where: { username } 
    });
    if (existingAdmin) {
      throw new BadRequestException('Username already exists');
    }

    if (!PASSWORD_REGEX.test(password)) {
      throw new BadRequestException(
        'Password must be at least 12 characters long and contain uppercase, lowercase, number, and special character'
      );
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const admin = this.adminRepository.create({
      username,
      password: hashedPassword,
    });
    return this.adminRepository.save(admin);
  }
}