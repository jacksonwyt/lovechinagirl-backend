// src/contact/contact.controller.ts
import { Controller, Post, Body, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @UseGuards(ThrottlerGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createContactDto: CreateContactDto) {
    return this.contactService.create(createContactDto);
  }
}