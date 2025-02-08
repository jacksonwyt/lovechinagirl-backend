import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProjectDto {
    @IsString()
    title: string;

    @IsString()
    description: string;

    @IsNumber()
    @Transform(({ value }) => Number(value))
    year: number;

    @IsArray()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            return value.split(',').map(tag => tag.trim());
        }
        return value;
    })
    tags: string[];
}

export class UpdateProjectDto extends CreateProjectDto {
    @IsOptional()
    @IsArray()
    images?: string[];
}