// portfolio-backend/src/scripts/create-admin.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { AdminService } from '../admin/admin.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const adminService = app.get(AdminService);

  try {
    await adminService.createAdmin('Monte$ano1234', 'ArleneP@ssw0rd805');
    console.log('Admin created successfully');
  } catch (error) {
    console.error('Failed to create admin:', error);
  }

  await app.close();
}

bootstrap();