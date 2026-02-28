import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto, UpdateItemDto } from './dto/item.dto';

@Injectable()
export class ItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(includeUnavailable = false) {
    const where = includeUnavailable ? {} : { isAvailable: true };
    return this.prisma.item.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const item = await this.prisma.item.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async create(dto: CreateItemDto) {
    return this.prisma.item.create({ data: dto });
  }

  async update(id: string, dto: UpdateItemDto) {
    await this.findById(id);
    return this.prisma.item.update({ where: { id }, data: dto });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.item.delete({ where: { id } });
  }

  async toggleAvailability(id: string) {
    const item = await this.findById(id);
    return this.prisma.item.update({
      where: { id },
      data: { isAvailable: !item.isAvailable },
    });
  }

  async count() {
    return this.prisma.item.count();
  }
}
