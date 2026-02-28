import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.review.findMany({
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
        item: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByItem(itemId: string) {
    return this.prisma.review.findMany({
      where: { itemId },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateReviewDto) {
    return this.prisma.review.create({
      data: {
        userId,
        itemId: dto.itemId,
        orderId: dto.orderId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
        item: { select: { id: true, name: true } },
      },
    });
  }

  async delete(id: string, userId: string, isAdmin: boolean) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    if (!isAdmin && review.userId !== userId) {
      throw new NotFoundException('Review not found');
    }
    return this.prisma.review.delete({ where: { id } });
  }
}
