// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const apiUrl = configService.get('API_URL');

  app.use(compression());

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          'default-src': "'self'",
          'base-uri': "'self'",
          'font-src': ["'self'", "https://fonts.gstatic.com"],
          'form-action': "'self'",
          'frame-ancestors': "'self'",
          'img-src': ["'self'", "data:", "blob:", apiUrl].filter(Boolean),
          'object-src': "'none'",
          'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          'script-src-attr': "'none'",
          'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          'connect-src': ["'self'", apiUrl].filter(Boolean),
          'upgrade-insecure-requests': [],
        },
      },
    })
  );
  
  // Rest of your configuration...
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  }));

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  app.setGlobalPrefix('api');

  if (configService.get('NODE_ENV') === 'production') {
    app.use((req, res, next) => {
      if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(`https://${req.hostname}${req.url}`);
      }
      next();
    });
  }

  await app.listen(configService.get('PORT') || 3001);
}
bootstrap();