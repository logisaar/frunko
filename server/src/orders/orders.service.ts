import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) { }

  async findByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId, status: { not: 'cancelled' } },
      include: { orderItems: { include: { item: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.order.findMany({
      where: { status: { not: 'cancelled' } },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        orderItems: { include: { item: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { orderItems: { include: { item: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (userId && order.userId !== userId) {
      throw new ForbiddenException('Not your order');
    }
    return order;
  }

  async create(userId: string, dto: CreateOrderDto) {
    const qrCode = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return this.prisma.order.create({
      data: {
        userId,
        totalAmount: dto.totalAmount,
        deliveryAddress: dto.deliveryAddress,
        couponCode: dto.couponCode,
        discountAmount: dto.discountAmount,
        qrCode,
        orderItems: {
          create: dto.items.map((item) => ({
            itemId: item.itemId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { orderItems: { include: { item: true } } },
    });
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    const data: any = { status: dto.status };
    if (dto.status === 'delivered') {
      data.completedAt = new Date();
    }

    return this.prisma.order.update({
      where: { id },
      data,
      include: { orderItems: { include: { item: true } } },
    });
  }

  async count() {
    return this.prisma.order.count();
  }

  async totalRevenue() {
    const result = await this.prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { status: { not: 'cancelled' } },
    });
    return result._sum.totalAmount || 0;
  }

  async recentOrders(limit = 5) {
    return this.prisma.order.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        orderItems: { include: { item: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async delete(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    await this.prisma.order.delete({ where: { id } });
    return { message: 'Order deleted successfully' };
  }
}
