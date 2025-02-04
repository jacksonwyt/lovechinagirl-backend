// src/contact/dto/create-contact.dto.ts
import { IsString, IsEmail, MinLength } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(10)
  message: string;
}