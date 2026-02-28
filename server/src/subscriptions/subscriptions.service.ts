import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.subscription.findMany({
            include: {
                user: true,
                plan: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}
