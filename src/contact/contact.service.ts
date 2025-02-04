import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './contact.entity';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ContactService {
  private transporter;

  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
    private configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: configService.get('SMTP_HOST'),
      port: configService.get('SMTP_PORT'),
      secure: true,
      auth: {
        user: configService.get('SMTP_USER'),
        pass: configService.get('SMTP_PASSWORD'),
      },
    });
  }

  async create(contact: Partial<Contact>): Promise<Contact> {
    const savedContact = await this.contactRepository.save(contact);
    
    await this.transporter.sendMail({
      from: this.configService.get('SMTP_USER'),
      to: this.configService.get('CONTACT_EMAIL'),
      subject: `New Contact Form Submission from ${contact.name}`,
      text: `
        Name: ${contact.name}
        Email: ${contact.email}
        Message: ${contact.message}
      `,
    });

    return savedContact;
  }
}