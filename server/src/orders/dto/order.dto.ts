import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderItemDto {
  @IsString()
  itemId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0.01)
  price!: number;
}

export class CreateOrderDto {
  @IsNumber()
  @Min(0.01)
  totalAmount!: number;

  @IsString()
  deliveryAddress!: string;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];
}

enum OrderStatus {
  pending = 'pending',
  preparing = 'preparing',
  out_for_delivery = 'out_for_delivery',
  delivered = 'delivered',
  cancelled = 'cancelled',
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
