// src/config/typeorm.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Project } from '../projects/project.entity';
import { Admin } from '../admin/admin.entity';
import { Contact } from '../contact/contact.entity';
import { ShopItem } from '../shop/shop-item.entity';
import { readFileSync } from 'fs';
import { join } from 'path';

export const typeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: configService.get('DB_PORT'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_DATABASE'),
  entities: [Project, Admin, Contact, ShopItem],
  synchronize: configService.get('NODE_ENV') !== 'production',
  extra: {
    max: configService.get('DB_POOL_SIZE', 20),
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    statement_timeout: 10000,
  },
  ssl: configService.get('NODE_ENV') === 'production' ? {
    rejectUnauthorized: true,
    ca: readFileSync(join(process.cwd(), 'ssl/ca-certificate.crt')),
  } : false,
  logging: configService.get('NODE_ENV') !== 'production',
  logger: 'advanced-console',
  autoLoadEntities: true,
  migrations: ['dist/migrations/*.js'],
  migrationsRun: true,
  
});