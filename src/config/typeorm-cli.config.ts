import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as dotenv from 'dotenv';
import { Project } from '../projects/project.entity';
import { Admin } from '../admin/admin.entity';
import { Contact } from '../contact/contact.entity';
import { ShopItem } from '../shop/shop-item.entity';

// Load environment variables
dotenv.config({ path: '.env.production' });

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: configService.get('DB_PORT'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_DATABASE'),
  entities: [Project, Admin, Contact, ShopItem],
  migrations: ['src/migrations/*.ts'],
  ssl: {
    rejectUnauthorized: false
  }
});