import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class InitiatePaymentDto {
    @IsString()
    orderId!: string;

    @IsNumber()
    @Min(0.01)
    amount!: number;

    @IsOptional()
    @IsString()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;
}
