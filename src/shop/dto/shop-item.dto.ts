import { IsString, IsEnum, IsArray, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateShopItemDto {
    @IsString()
    name: string;

    @IsString()
    description: string;

    @IsString()
    category: string;

    @IsArray()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            return value.split(',').map(tag => tag.trim());
        }
        return value;
    })

    @IsEnum(['available', 'sold', 'reserved'])
    status: 'available' | 'sold' | 'reserved';
}

export class UpdateShopItemDto extends CreateShopItemDto {
    @IsOptional()
    @IsArray()
    images?: string[];
}