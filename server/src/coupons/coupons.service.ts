import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto, ValidateCouponDto } from './dto/coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.couponCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { usages: true } } },
    });
  }

  async create(dto: CreateCouponDto) {
    return this.prisma.couponCode.create({
      data: {
        code: dto.code.toUpperCase(),
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        maxDiscount: dto.maxDiscount,
        minOrderValue: dto.minOrderValue,
        usageLimit: dto.usageLimit,
        isActive: dto.isActive ?? true,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
      },
    });
  }

  async validate(dto: ValidateCouponDto) {
    const code = dto.code.trim().toUpperCase();

    const coupon = await this.prisma.couponCode.findUnique({
      where: { code },
    });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException('Invalid coupon code');
    }

    const now = new Date();
    if (coupon.validUntil && new Date(coupon.validUntil) < now) {
      throw new BadRequestException('This coupon has expired');
    }
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      throw new BadRequestException('This coupon is not yet active');
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('This coupon has reached its usage limit');
    }

    const subtotal = dto.subtotal;
    if (coupon.minOrderValue && subtotal < Number(coupon.minOrderValue)) {
      throw new BadRequestException(
        `Minimum order value is ₹${coupon.minOrderValue}`,
      );
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (subtotal * Number(coupon.discountValue)) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, Number(coupon.maxDiscount));
      }
    } else {
      discount = Number(coupon.discountValue);
    }

    discount = Math.min(discount, subtotal);
    const discountPercent = subtotal > 0 ? (discount / subtotal) * 100 : 0;

    return {
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: Number(coupon.discountValue),
      discount: Math.round(discount * 100) / 100,
      discountPercent: Math.round(discountPercent * 100) / 100,
      finalAmount: Math.round((subtotal - discount) * 100) / 100,
    };
  }

  async delete(id: string) {
    const coupon = await this.prisma.couponCode.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return this.prisma.couponCode.delete({ where: { id } });
  }

  async toggleActive(id: string) {
    const coupon = await this.prisma.couponCode.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return this.prisma.couponCode.update({
      where: { id },
      data: { isActive: !coupon.isActive },
    });
  }
}
