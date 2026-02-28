import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const menuItems = [
    // Sandwich Section
    { name: 'Veg Sandwich', price: 50, category: 'snacks' },
    { name: 'Paneer Sandwich', price: 60, category: 'snacks' },
    { name: 'Chocolate Sandwich', price: 40, category: 'snacks' },

    // Pasta Section
    { name: 'White Sauce Pasta', price: 65, category: 'snacks' },
    { name: 'Red Sauce Pasta', price: 65, category: 'snacks' },

    // Burger Section
    { name: 'Single Aloo Patty Burger', price: 45, category: 'snacks' },
    { name: 'Double Aloo Patty Burger', price: 55, category: 'snacks' },
    { name: 'Paneer Patty Burger', price: 65, category: 'snacks' },

    // Maggi Section
    { name: 'Veggie Boost Maggi', price: 55, category: 'snacks' },
    { name: 'Creamy Corn Maggi', price: 65, category: 'snacks' },
    { name: 'Desi Masala Maggi', price: 50, category: 'snacks' },

    // Juice Section
    { name: 'Apple Juice', price: 42, category: 'beverages' },
    { name: 'Guava Juice', price: 42, category: 'beverages' },
    { name: 'Orange Juice', price: 42, category: 'beverages' },
    { name: 'Watermelon Juice', price: 42, category: 'beverages' },
    { name: 'Mosambi Juice', price: 42, category: 'beverages' },
    { name: 'Pineapple Juice', price: 50, category: 'beverages' },
    { name: 'Pomegranate Juice', price: 55, category: 'beverages' },
    { name: 'Mixed Fruit Juice', price: 40, category: 'beverages' },
    { name: 'Apple + Beetroot + Carrot Juice', price: 45, category: 'beverages' },
    { name: 'Honey Lemon Chia Seed Juice', price: 20, category: 'beverages' },
    { name: 'Gut Glow Juice', price: 30, category: 'beverages' },

    // Milkshake Section
    { name: 'Dryfruits Shake', price: 60, category: 'beverages' },
    { name: 'Apple Banana Shake', price: 54, category: 'beverages' },
    { name: 'Sattu Shakti Shake', price: 50, category: 'beverages' },
    { name: 'Oreo Shake', price: 58, category: 'beverages' },
    { name: 'Dark Chocolate Shake', price: 60, category: 'beverages' },
    { name: 'Banana Date Shake', price: 49, category: 'beverages' },
    { name: 'Whey Protein Shake', price: 69, category: 'beverages' },
    { name: 'Strawberry Shake', price: 65, category: 'beverages' },

    // Frunko Bowls
    { name: 'Mix Fruit Bowl', price: 40, category: 'breakfast' },
    { name: 'Mix Fruit Bowl with Curd', price: 40, category: 'breakfast' },
    { name: 'Overnight Oatmeal', price: 49, category: 'breakfast' },
    { name: 'Choco Fudge Oatmeal', price: 55, category: 'breakfast' },

    // Frunko Salads
    { name: 'Mix Veggies Salad', price: 45, category: 'lunch' },
    { name: 'Paneer Salad', price: 55, category: 'lunch' },
    { name: 'Soya Salad', price: 49, category: 'lunch' },

    // Frunko Desserts
    { name: 'Protein Choco Mousse', price: 60, category: 'desserts' },
    { name: 'Cheesecake', price: 60, category: 'desserts' },
    { name: 'Strawberry Cheese Cake', price: 70, category: 'desserts' },

    // Winter Special
    { name: 'Strawberry Hot Chocolate', price: 90, category: 'beverages' },

    // Coffee Section
    { name: 'Instant Milk Coffee (Paper Cup)', price: 20, category: 'beverages' },
    { name: 'Instant Milk Coffee (Glass Cup)', price: 30, category: 'beverages' },
    { name: 'Strong Black Coffee', price: 20, category: 'beverages' },
    { name: 'Filter Black Coffee', price: 40, category: 'beverages' },
    { name: 'Filter Milk Coffee', price: 48, category: 'beverages' },
    { name: 'Cold Coffee', price: 50, category: 'beverages' },
    { name: 'Mocha Milk Coffee', price: 50, category: 'beverages' },

    // Tea Section
    { name: 'Green Tea', price: 15, category: 'beverages' },
    { name: 'Lemon Tea', price: 15, category: 'beverages' },
    { name: 'Ginger Tea', price: 15, category: 'beverages' },
    { name: 'Herbal Tea', price: 25, category: 'beverages' },
    { name: 'Masala Milk Tea', price: 15, category: 'beverages' },
    { name: 'Kashmiri Pink Tea', price: 30, category: 'beverages' },

    // Special Combo
    { name: 'Bun Maska + Masala Tea', price: 45, category: 'snacks' },
];

async function main() {
    console.log('Start seeding menu...');
    for (const item of menuItems) {
        const createdItem = await prisma.item.create({
            data: {
                name: item.name,
                price: item.price,
                category: item.category as any, // casting to avoid enum warnings if tsc checks
                isVeg: true,
                isAvailable: true,
            },
        });
        console.log(`Created item: ${createdItem.name} with id: ${createdItem.id}`);
    }
    console.log('Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
