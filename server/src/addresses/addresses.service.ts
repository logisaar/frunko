import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressesService {
    constructor(private readonly prisma: PrismaService) { }

    async findByUser(userId: string) {
        return this.prisma.address.findMany({
            where: { userId },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        });
    }

    async create(userId: string, dto: CreateAddressDto) {
        // If this is set as default, unset other defaults
        if (dto.isDefault) {
            await this.prisma.address.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            });
        }

        // If user has no addresses, make this default
        const count = await this.prisma.address.count({ where: { userId } });
        const isDefault = dto.isDefault || count === 0;

        return this.prisma.address.create({
            data: {
                userId,
                label: dto.label,
                fullAddress: dto.fullAddress,
                latitude: dto.latitude,
                longitude: dto.longitude,
                landmark: dto.landmark,
                isDefault,
            },
        });
    }

    async update(id: string, userId: string, dto: UpdateAddressDto) {
        const address = await this.prisma.address.findFirst({
            where: { id, userId },
        });
        if (!address) throw new NotFoundException('Address not found');

        if (dto.isDefault) {
            await this.prisma.address.updateMany({
                where: { userId, isDefault: true },
                data: { isDefault: false },
            });
        }

        return this.prisma.address.update({
            where: { id },
            data: dto,
        });
    }

    async delete(id: string, userId: string) {
        const address = await this.prisma.address.findFirst({
            where: { id, userId },
        });
        if (!address) throw new NotFoundException('Address not found');

        await this.prisma.address.delete({ where: { id } });
        return { message: 'Address deleted' };
    }

    async setDefault(id: string, userId: string) {
        const address = await this.prisma.address.findFirst({
            where: { id, userId },
        });
        if (!address) throw new NotFoundException('Address not found');

        await this.prisma.address.updateMany({
            where: { userId, isDefault: true },
            data: { isDefault: false },
        });

        return this.prisma.address.update({
            where: { id },
            data: { isDefault: true },
        });
    }
}
