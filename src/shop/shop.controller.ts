// src/shop/shop.controller.ts
import { 
    Controller, 
    Get, 
    Post, 
    Put, 
    Delete, 
    Body, 
    Param, 
    UseGuards,
    UseInterceptors,
    UploadedFiles,
    ParseUUIDPipe
  } from '@nestjs/common';
  import { JwtAuthGuard } from '../admin/jwt-auth.guard';
  import { FilesInterceptor } from '@nestjs/platform-express';
  import { multerConfig } from '../common/middleware/upload.middleware';
  import { ShopService } from './shop.service';
  import { ShopItem } from './shop-item.entity';
  
  @Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get()
  findAll() {
    return this.shopService.findAll();
  }
  
    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string) {
      return this.shopService.findOne(id);
    }
  
    
    @Post()
    @UseGuards(JwtAuthGuard)
@UseInterceptors(FilesInterceptor('images', 10, multerConfig))
    create(
      @Body() item: Partial<ShopItem>,
      @UploadedFiles() files: Express.Multer.File[]
    ) {
      return this.shopService.create(item, files);
    }
  
    
    @Put(':id')
    @UseGuards(JwtAuthGuard)
@UseInterceptors(FilesInterceptor('images', 10, multerConfig))
    update(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() item: Partial<ShopItem>,
      @UploadedFiles() files: Express.Multer.File[]
    ) {
      return this.shopService.update(id, item, files);
    }
  
    
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(@Param('id', ParseUUIDPipe) id: string) {
      return this.shopService.remove(id);
    }
  }