import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Star, 
  Clock, 
  Truck,
  ChefHat,
  Crown,
  Leaf,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/hooks/useCart';

interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  is_veg: boolean;
  is_available: boolean;
  images: string[];
}

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  frequency: string;
}

export default function Home() {
  const [featuredItems, setFeaturedItems] = useState<FoodItem[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load featured items
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .eq('is_available', true)
        .limit(6);

      if (itemsError) throw itemsError;
      setFeaturedItems(items || []);

      // Load subscription plans
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true);

      if (plansError) throw plansError;
      setPlans(plansData || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      
      // Handle JWT expired error
      if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
        toast.error('Session expired. Please sign in again.');
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
      } else {
        toast.error('Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = featuredItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-bg mobile-nav-spacing">
      {/* Hero Section */}
      <section className="relative bg-gradient-hero text-orange-700 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              FRUNKO.in
            </h1>
            <p className="text-lg md:text-2xl mb-8 opacity-90">
              Fresh Meals, Delivered Daily - Subscribe to healthy, delicious meals
            </p>

            <div className="flex justify-center">
              <div className="inline-flex flex-col sm:flex-row items-center gap-4">
                <Link to="/menu" className="w-full sm:w-auto">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    <ChefHat className="mr-2 h-5 w-5" />
                    Browse Menu
                  </Button>
                </Link>

                <Link to="/plans" className="w-full sm:w-auto">
                  {/* make View Plans visible and use primary coloring so it shows on light backgrounds */}
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary text-primary">
                    <Crown className="mr-2 h-5 w-5" />
                    View Plans
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-muted-foreground">Fresh meals delivered within 30 minutes</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChefHat className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Chefs</h3>
              <p className="text-muted-foreground">Prepared by professional chefs with local ingredients</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Subscription Plans</h3>
              <p className="text-muted-foreground">Daily, weekly, or monthly meal plans available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-lg text-muted-foreground">
              Flexible subscription options to fit your lifestyle
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="relative hover:shadow-warm transition-shadow">
                {plan.frequency === 'monthly' && (
                  <Badge className="absolute -top-2 left-4 bg-primary">Most Popular</Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="text-3xl font-bold text-primary">
                    ₹{plan.price}
                    <span className="text-sm font-normal text-muted-foreground">
                      /{plan.frequency}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Link to="/plans">
                    <Button className="w-full" variant={plan.frequency === 'monthly' ? 'default' : 'outline'}>
                      Select Plan
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Items */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Featured Items</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Popular dishes loved by our customers
            </p>
            <div className="max-w-md w-full mx-auto relative px-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="group hover:shadow-warm transition-all duration-300 hover:-translate-y-1">
                <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center overflow-hidden">
                  {item.images && item.images.length > 0 ? (
                    <img 
                      src={item.images[0]} 
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <ChefHat className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <div className="flex items-center space-x-1">
                      {item.is_veg ? (
                        <Badge variant="secondary" className="bg-secondary/20 text-secondary">
                          <Leaf className="h-3 w-3 mr-1" />
                          Veg
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-destructive/20 text-destructive">
                          Non-Veg
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">₹{item.price}</span>
                    <div className="flex items-center space-x-1 text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm text-muted-foreground">4.5</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4 touch-target" 
                    onClick={() => addToCart({
                      item_id: item.id,
                      name: item.name,
                      price: item.price,
                      image: item.images?.[0],
                      is_veg: item.is_veg
                    })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No items found matching your search.</p>
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link to="/menu">
              <Button size="lg" variant="outline">
                View Full Menu
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}