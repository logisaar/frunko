import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Star, 
  Leaf,
  Plus,
  ChefHat,
  Filter
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type FoodItem = Database['public']['Tables']['items']['Row'];
type FoodCategory = Database['public']['Enums']['food_category'];

export default function Menu() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const categories: (FoodCategory | 'all')[] = [
    'all',
    'Nutri-shakes', 
    'frunko_bowls',
    'desserts'
  ];

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedCategory]);

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('is_available', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error loading items:', error);
      
      // Handle JWT expired error
      if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
        toast.error('Session expired. Please sign in again.');
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
      } else {
        toast.error('Failed to load menu items');
      }
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = items;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredItems(filtered);
  };

  const handleAddToCart = (item: FoodItem) => {
    addToCart({
      item_id: item.id,
      name: item.name,
      price: item.price,
      image: item.images?.[0],
      is_veg: item.is_veg
    });
  };

  const getCategoryLabel = (category: FoodCategory | 'all') => {
    if (category === 'all') return 'All';
    if (category === 'frunko_bowls') return 'Frunko Bowls';
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-bg mobile-nav-spacing">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Our Menu</h1>
          
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search dishes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar smooth-scroll">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {getCategoryLabel(category)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="p-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No items found matching your search.' : 'No items available in this category.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="flex">
                  {/* Image */}
                  <div className="w-24 h-24 bg-muted flex-shrink-0 flex items-center justify-center">
                    {item.images && item.images.length > 0 ? (
                      <img 
                        src={item.images[0]} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ChefHat className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{item.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        {item.is_veg ? (
                          <Badge variant="secondary" className="bg-secondary/20 text-secondary text-xs">
                            <Leaf className="h-3 w-3 mr-1" />
                            Veg
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-destructive/20 text-destructive text-xs">
                            Non-Veg
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-primary">₹{item.price}</span>
                        <div className="flex items-center space-x-1 text-yellow-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-sm text-muted-foreground">4.5</span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleAddToCart(item)}
                        className="flex items-center space-x-1 touch-target"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
