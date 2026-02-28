import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateAddressDto {
    @IsString()
    label!: string;

    @IsString()
    fullAddress!: string;

    @IsOptional()
    @IsNumber()
    latitude?: number;

    @IsOptional()
    @IsNumber()
    longitude?: number;

    @IsOptional()
    @IsString()
    landmark?: string;

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}

export class UpdateAddressDto {
    @IsOptional()
    @IsString()
    label?: string;

    @IsOptional()
    @IsString()
    fullAddress?: string;

    @IsOptional()
    @IsNumber()
    latitude?: number;

    @IsOptional()
    @IsNumber()
    longitude?: number;

    @IsOptional()
    @IsString()
    landmark?: string;

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}
