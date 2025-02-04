// src/shop/shop.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopItem } from './shop-item.entity';
import { ConfigService } from '@nestjs/config';
import { uploadToS3 } from '../common/middleware/upload.middleware';

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(ShopItem)
    private shopRepository: Repository<ShopItem>,
    private configService: ConfigService,
  ) {}

  findAll() {
    return this.shopRepository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string) {
    const item = await this.shopRepository.findOneBy({ id });
    if (!item) {
      throw new NotFoundException(`Shop item with ID ${id} not found`);
    }
    return item;
  }

  async create(item: Partial<ShopItem>, files: Express.Multer.File[]) {
    const imageUrls = await Promise.all(
      files.map(async (file) => {
        if (process.env.NODE_ENV === 'production') {
          const s3Url = await uploadToS3(file);
          return s3Url || `${this.configService.get('API_URL')}/uploads/${file.filename}`;
        }
        return `${this.configService.get('API_URL')}/uploads/${file.filename}`;
      })
    ).then(urls => urls.filter((url): url is string => url !== null));

    const newItem = this.shopRepository.create({
      ...item,
      images: imageUrls
    });
    return this.shopRepository.save(newItem);
  }

  async update(id: string, item: Partial<ShopItem>, files?: Express.Multer.File[]) {
    const existingItem = await this.findOne(id);
    
    const newImageUrls = files?.length
      ? await Promise.all(
          files.map(async (file) => {
            if (process.env.NODE_ENV === 'production') {
              const s3Url = await uploadToS3(file);
              return s3Url || `${this.configService.get('API_URL')}/uploads/${file.filename}`;
            }
            return `${this.configService.get('API_URL')}/uploads/${file.filename}`;
          })
        ).then(urls => urls.filter((url): url is string => url !== null))
      : [];

    const imageUrls = [...existingItem.images, ...newImageUrls];

    await this.shopRepository.update(id, {
      ...item,
      images: imageUrls
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    const result = await this.shopRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Shop item with ID ${id} not found`);
    }
  }
}