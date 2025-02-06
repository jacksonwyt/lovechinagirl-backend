// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER } from '@nestjs/core';
import { typeOrmConfig } from './config/typeorm.config';
import { ProjectsModule } from './projects/projects.module';
import { ContactModule } from './contact/contact.module';
import { AdminModule } from './admin/admin.module';
import { GlobalExceptionFilter } from './common/middleware/error.middleware';
import { ShopModule } from './shop/shop.module';
import { HealthModule } from './health/health.module'
import { validate } from './config/env.validation';
import { LoggerModule } from './logger/logger.module';

@Module({
 imports: [
   ConfigModule.forRoot({ 
    validate, 
    isGlobal: true,
   }),
   TypeOrmModule.forRootAsync({
     imports: [ConfigModule],
     useFactory: typeOrmConfig,
     inject: [ConfigService],
   }),
   ThrottlerModule.forRoot([{
    ttl: 60000,
    limit: 5,
  }]),
   ProjectsModule,
   ContactModule,
   AdminModule,
   ShopModule,
   HealthModule,
   LoggerModule,
 ],
 providers: [
   {
     provide: APP_FILTER,
     useClass: GlobalExceptionFilter,
   },
 ],
})
export class AppModule {}