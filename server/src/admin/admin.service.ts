import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    async getDashboardStats() {
        const [totalOrders, totalUsers, totalItems, activeSubscriptions, orders, subscriptions] = await Promise.all([
            this.prisma.order.count({
                where: {
                    OR: [
                        { paymentStatus: 'paid' },
                        { status: 'preparing' },
                        { status: 'out_for_delivery' },
                        { status: 'delivered' }
                    ]
                }
            }),
            this.prisma.user.count(),
            this.prisma.item.count(),
            this.prisma.subscription.count({ where: { status: 'active' } }),
            this.prisma.order.findMany({
                where: {
                    OR: [
                        { paymentStatus: 'paid' },
                        { status: 'preparing' },
                        { status: 'out_for_delivery' },
                        { status: 'delivered' }
                    ]
                },
                select: { totalAmount: true }
            }),
            this.prisma.subscription.findMany({
                where: { status: 'active' },
                include: { plan: true }
            })
        ]);

        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        const totalSubscriptionRevenue = subscriptions.reduce((sum, sub) => sum + Number(sub.plan.price), 0);

        return {
            totalOrders,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            totalUsers,
            totalItems,
            activeSubscriptions,
            totalSubscriptionRevenue: Math.round(totalSubscriptionRevenue * 100) / 100
        };
    }
}
