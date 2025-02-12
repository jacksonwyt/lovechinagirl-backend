// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import * as compression from 'compression';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { 
    bodyParser: false 
  });
  
  const configService = app.get(ConfigService);
  const apiUrl = configService.get('API_URL');

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
  app.use(compression());

  const expressApp = app.getHttpAdapter().getInstance();
expressApp.set('trust proxy', 1);

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
          'img-src': ["'self'", "data:", "blob:", "*.amazonaws.com"],
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
    message: 'Too many requests from this IP'
  }));

  app.enableCors({
    origin: [
      'https://lovechinagirldesign.com',
      'https://www.lovechinagirldesign.com',
      'https://api.lovechinagirldesign.com',
      'http://localhost:3000',
      'http://localhost:3001'
    ],
    credentials: true,
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Access-Control-Allow-Origin'
    ],
    exposedHeaders: ['Access-Control-Allow-Origin']
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  app.setGlobalPrefix('api', {
    exclude: ['/health'], // Health check available at root
  });

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