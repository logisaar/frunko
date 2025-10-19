import { supabase } from '@/integrations/supabase/client';

export const seedSampleData = async () => {
  try {
    console.log('Starting to seed sample data...');

    // Sample menu items
    const sampleItems = [
      {
        name: 'Masala Dosa',
        description: 'Crispy rice crepe filled with spiced potatoes, served with coconut chutney and sambar',
        price: 120,
        category: 'breakfast' as const,
        is_veg: true,
        is_available: true,
        images: ['https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400']
      },
      {
        name: 'Chicken Biryani',
        description: 'Fragrant basmati rice cooked with tender chicken pieces and aromatic spices',
        price: 280,
        category: 'lunch' as const,
        is_veg: false,
        is_available: true,
        images: ['https://images.unsplash.com/photo-1563379091339-03246963d4d8?w=400']
      },
      {
        name: 'Paneer Butter Masala',
        description: 'Soft cottage cheese cubes in rich tomato and cream gravy',
        price: 220,
        category: 'dinner' as const,
        is_veg: true,
        is_available: true,
        images: ['https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400']
      },
      {
        name: 'Samosa',
        description: 'Crispy fried pastry filled with spiced potatoes and peas',
        price: 25,
        category: 'snacks' as const,
        is_veg: true,
        is_available: true,
        images: ['https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400']
      },
      {
        name: 'Mango Lassi',
        description: 'Refreshing yogurt drink with sweet mango pulp',
        price: 80,
        category: 'beverages' as const,
        is_veg: true,
        is_available: true,
        images: ['https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400']
      },
      {
        name: 'Gulab Jamun',
        description: 'Soft milk dumplings soaked in rose-flavored sugar syrup',
        price: 60,
        category: 'desserts' as const,
        is_veg: true,
        is_available: true,
        images: ['https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400']
      },
      {
        name: 'Idli Sambar',
        description: 'Soft steamed rice cakes served with lentil curry',
        price: 80,
        category: 'breakfast' as const,
        is_veg: true,
        is_available: true,
        images: ['https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400']
      },
      {
        name: 'Fish Curry',
        description: 'Fresh fish cooked in coconut milk and aromatic spices',
        price: 320,
        category: 'lunch' as const,
        is_veg: false,
        is_available: true,
        images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400']
      },
      {
        name: 'Dal Makhani',
        description: 'Creamy black lentils slow-cooked with butter and cream',
        price: 180,
        category: 'dinner' as const,
        is_veg: true,
        is_available: true,
        images: ['https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400']
      },
      {
        name: 'Pakora',
        description: 'Deep-fried fritters made with vegetables and gram flour',
        price: 45,
        category: 'snacks' as const,
        is_veg: true,
        is_available: true,
        images: ['https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400']
      }
    ];

    // Sample subscription plans
    const samplePlans = [
      {
        name: 'Daily Fresh',
        description: 'Perfect for trying new dishes every day',
        price: 150,
        frequency: 'daily' as const,
        is_active: true
      },
      {
        name: 'Weekly Feast',
        description: 'Weekly meal planning with variety and savings',
        price: 900,
        frequency: 'weekly' as const,
        is_active: true
      },
      {
        name: 'Monthly Master',
        description: 'Maximum savings with monthly subscription',
        price: 3200,
        frequency: 'monthly' as const,
        is_active: true
      }
    ];

    // Insert items
    console.log('Inserting menu items...');
    const { error: itemsError } = await supabase
      .from('items')
      .insert(sampleItems);

    if (itemsError) {
      console.error('Error inserting items:', itemsError);
    } else {
      console.log('Menu items inserted successfully');
    }

    // Insert plans
    console.log('Inserting subscription plans...');
    const { error: plansError } = await supabase
      .from('plans')
      .insert(samplePlans);

    if (plansError) {
      console.error('Error inserting plans:', plansError);
    } else {
      console.log('Subscription plans inserted successfully');
    }

    console.log('Sample data seeding completed!');
    return { success: true };

  } catch (error) {
    console.error('Error seeding data:', error);
    return { success: false, error };
  }
};

// Function to check if data exists
export const checkDataExists = async () => {
  try {
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('id')
      .limit(1);

    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('id')
      .limit(1);

    return {
      hasItems: !itemsError && items && items.length > 0,
      hasPlans: !plansError && plans && plans.length > 0
    };
  } catch (error) {
    console.error('Error checking data:', error);
    return { hasItems: false, hasPlans: false };
  }
};
