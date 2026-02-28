import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@frunko.in' },
        update: {},
        create: {
            email: 'admin@frunko.in',
            password: adminPassword,
            fullName: 'Frunko Admin',
            role: 'admin',
        },
    });
    console.log('✅ Admin user created:', admin.email);

    // Create sample items
    // const items = await Promise.all([
    //     prisma.item.upsert({
    //         where: { id: '00000000-0000-0000-0000-000000000001' },
    //         update: {},
    //         create: {
    //             id: '00000000-0000-0000-0000-000000000001',
    //             name: 'Masala Dosa',
    //             description: 'Crispy dosa with spiced potato filling',
    //             price: 89.0,
    //             category: 'breakfast',
    //             isVeg: true,
    //         },
    //     }),
    //     prisma.item.upsert({
    //         where: { id: '00000000-0000-0000-0000-000000000002' },
    //         update: {},
    //         create: {
    //             id: '00000000-0000-0000-0000-000000000002',
    //             name: 'Butter Chicken',
    //             description: 'Rich and creamy chicken curry',
    //             price: 249.0,
    //             category: 'lunch',
    //             isVeg: false,
    //         },
    //     }),
    //     prisma.item.upsert({
    //         where: { id: '00000000-0000-0000-0000-000000000003' },
    //         update: {},
    //         create: {
    //             id: '00000000-0000-0000-0000-000000000003',
    //             name: 'Paneer Butter Masala',
    //             description: 'Cottage cheese in rich tomato gravy',
    //             price: 199.0,
    //             category: 'lunch',
    //             isVeg: true,
    //         },
    //     }),
    //     prisma.item.upsert({
    //         where: { id: '00000000-0000-0000-0000-000000000004' },
    //         update: {},
    //         create: {
    //             id: '00000000-0000-0000-0000-000000000004',
    //             name: 'Biryani',
    //             description: 'Aromatic basmati rice with spices',
    //             price: 299.0,
    //             category: 'lunch',
    //             isVeg: false,
    //         },
    //     }),
    //     prisma.item.upsert({
    //         where: { id: '00000000-0000-0000-0000-000000000005' },
    //         update: {},
    //         create: {
    //             id: '00000000-0000-0000-0000-000000000005',
    //             name: 'Fresh Fruit Salad',
    //             description: 'Seasonal fruits with honey',
    //             price: 99.0,
    //             category: 'snacks',
    //             isVeg: true,
    //         },
    //     }),
    //     prisma.item.upsert({
    //         where: { id: '00000000-0000-0000-0000-000000000006' },
    //         update: {},
    //         create: {
    //             id: '00000000-0000-0000-0000-000000000006',
    //             name: 'Masala Chai',
    //             description: 'Traditional Indian spiced tea',
    //             price: 29.0,
    //             category: 'beverages',
    //             isVeg: true,
    //         },
    //     }),
    // ]);
    // console.log(`✅ ${items.length} items created`);

    // Create subscription plans
    const plans = await Promise.all([
        prisma.plan.upsert({
            where: { id: '00000000-0000-0000-0000-000000000010' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000010',
                name: 'Daily Plan',
                frequency: 'daily',
                price: 299.0,
                description: 'Fresh meals delivered daily',
            },
        }),
        prisma.plan.upsert({
            where: { id: '00000000-0000-0000-0000-000000000011' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000011',
                name: 'Weekly Plan',
                frequency: 'weekly',
                price: 1899.0,
                description: 'Weekly meal subscription with variety',
            },
        }),
        prisma.plan.upsert({
            where: { id: '00000000-0000-0000-0000-000000000012' },
            update: {},
            create: {
                id: '00000000-0000-0000-0000-000000000012',
                name: 'Monthly Plan',
                frequency: 'monthly',
                price: 6999.0,
                description: 'Complete monthly meal solution',
            },
        }),
    ]);
    console.log(`✅ ${plans.length} plans created`);

    console.log('🎉 Seed complete!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
