// src/config/env.validation.ts
import { plainToClass, Type } from 'class-transformer';
import { IsString, IsNumber, IsEnum, validateSync, IsOptional } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @Type(() => Number)
  @IsNumber()
  PORT: number;

  @IsString()
  JWT_SECRET: string;

  @IsString()
  DB_HOST: string;

  @Type(() => Number)
  @IsNumber()
  DB_PORT: number;

  @IsString()
  DB_USERNAME: string;

  @IsString()
  DB_PASSWORD: string;

  @IsString()
  DB_DATABASE: string;

  @IsString()
  @IsOptional()
  SMTP_HOST: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  SMTP_PORT: number;

  @IsString()
  @IsOptional()
  SMTP_USER: string;

  @IsString()
  @IsOptional()
  SMTP_PASSWORD: string;

  @IsString()
  @IsOptional()
  CONTACT_EMAIL: string;

  @IsString()
  @IsOptional()
  AWS_REGION: string;

  @IsString()
  @IsOptional()
  AWS_ACCESS_KEY: string;

  @IsString()
  @IsOptional()
  AWS_SECRET_KEY: string;

  @IsString()
  @IsOptional()
  AWS_BUCKET_NAME: string;

  @IsString()
  API_URL: string;

  @IsString()
  FRONTEND_URL: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config);
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
