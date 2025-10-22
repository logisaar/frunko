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
  Plus,
  Check
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
    <div className="min-h-screen bg-gradient-to-br from-[#FFF7EE] via-[#FFF7EE] to-[#F9E9D2] text-[#3B1F0A] mobile-nav-spacing relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-32 h-32 bg-[#F7934C] rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-[#F5E0C8] rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-[#FFF7EE] rounded-full blur-3xl"></div>
      </div>

      {/* ================= Navbar ================= */}
      <header className="relative z-10 py-6 px-6 flex justify-between items-center bg-transparent backdrop-blur-sm">
        <h1 className="text-2xl font-bold animate-fade-in">Frunko</h1>
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/menu" className="hover:text-[#F7934C] transition-colors duration-300">Menu</Link>
          <Link to="/plans" className="hover:text-[#F7934C] transition-colors duration-300">Plans</Link>
          <Link to="/about" className="hover:text-[#F7934C] transition-colors duration-300">About</Link>
          <Link to="/plans">
            <Button className="bg-[#F7934C] hover:bg-[#e9833e] text-white font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              Start My Plan
            </Button>
          </Link>
        </nav>
      </header>

      {/* ================= Hero Section ================= */}
      <section className="relative z-10 bg-transparent py-16 md:py-24">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between">

          {/* Left Text Content */}
          <div className="max-w-lg mb-10 md:mb-0 animate-slide-up">
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 bg-gradient-to-r from-[#3B1F0A] via-[#F7934C] to-[#3B1F0A] bg-clip-text text-transparent animate-gradient">
              Healthy <br /> Starts Here.
            </h1>
            <p className="text-lg text-[#6E4E29] mb-8 animate-fade-in-delayed">
              Fresh, delicious oat bowls and fruit salads — delivered daily with your Frunko subscription.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-delayed-2">
              <Link to="/plans">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-[#F7934C] to-[#e9833e] hover:from-[#e9833e] hover:to-[#d9732a] text-white font-semibold px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:rotate-1"
                >
                  Start My Plan
                </Button>
              </Link>
              <Link to="/menu">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-[#F9E9D2]/80 backdrop-blur-sm hover:bg-[#f5ddc0] text-[#3B1F0A] border-2 border-[#F7934C]/30 hover:border-[#F7934C] font-semibold px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  View Menu
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Image */}
          <div className="w-full md:w-1/2 flex justify-center animate-bounce-in">
            <div className="relative">
              <img
                src="/assets/mix-fruit-bowl.jpg"
                alt="Fruit Bowl"
                className="w-[350px] md:w-[420px] rounded-full shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-110 hover:rotate-3"
              />
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-[#F7934C] rounded-full animate-ping"></div>
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-[#F5E0C8] rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ================ Features Section ================ */}
      <section className="py-16 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F7934C]/5 to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 animate-fade-in">Why Choose Frunko?</h2>
            <p className="text-lg text-[#6E4E29] animate-fade-in-delayed">Experience the difference with our premium healthy meal service</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group hover:scale-105 transition-transform duration-300 animate-slide-up">
              <div className="w-20 h-20 bg-gradient-to-br from-[#F7934C]/20 to-[#F7934C]/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <Clock className="h-10 w-10 text-[#F7934C] group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-[#F7934C] transition-colors duration-300">Fast Delivery</h3>
              <p className="text-[#6E4E29]">Fresh meals delivered within 30 minutes to your doorstep</p>
            </div>
            <div className="text-center group hover:scale-105 transition-transform duration-300 animate-slide-up-delayed">
              <div className="w-20 h-20 bg-gradient-to-br from-[#F9E9D2] to-[#F5E0C8] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <ChefHat className="h-10 w-10 text-[#3B1F0A] group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-[#F7934C] transition-colors duration-300">Expert Chefs</h3>
              <p className="text-[#6E4E29]">Prepared by professional chefs using fresh, local ingredients</p>
            </div>
            <div className="text-center group hover:scale-105 transition-transform duration-300 animate-slide-up-delayed-2">
              <div className="w-20 h-20 bg-gradient-to-br from-[#F5E0C8] to-[#F7934C]/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <Truck className="h-10 w-10 text-[#F7934C] group-hover:scale-110 transition-transform duration-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-[#F7934C] transition-colors duration-300">Flexible Plans</h3>
              <p className="text-[#6E4E29]">Daily, weekly, or monthly subscription plans tailored to you</p>
            </div>
          </div>
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="py-16 bg-gradient-to-br from-[#F9E9D2]/50 to-[#FFF7EE]/50 relative overflow-hidden">
        {/* Dynamic Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-20 h-20 bg-[#F7934C]/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-32 h-32 bg-[#F5E0C8]/20 rounded-full blur-xl animate-bounce"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#FFF7EE]/30 rounded-full blur-2xl animate-spin-slow"></div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F7934C]/5 to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 animate-fade-in">Choose Your Plan</h2>
            <p className="text-lg text-[#6E4E29] animate-fade-in-delayed">
              Flexible subscription options to fit your lifestyle and save more
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => {
              const getFrequencyIcon = (frequency: string) => {
                switch (frequency) {
                  case 'daily': return <Clock className="h-6 w-6" />;
                  case 'weekly': return <Star className="h-6 w-6" />;
                  case 'monthly': return <Crown className="h-6 w-6" />;
                  default: return <Crown className="h-6 w-6" />;
                }
              };

              const getPlanFeatures = (frequency: string) => {
                switch (frequency) {
                  case 'daily':
                    return ['Fresh daily delivery', 'Flexible timing', 'Cancel anytime'];
                  case 'weekly':
                    return ['Weekly meal planning', '15% savings', 'Bulk discounts'];
                  case 'monthly':
                    return ['Max savings (25%)', 'Priority support', 'Custom preferences'];
                  default:
                    return ['Fresh ingredients', 'Expert preparation', 'Free delivery'];
                }
              };

              return (
                <Card key={plan.id} className="relative overflow-hidden hover:shadow-2xl hover:shadow-[#F7934C]/30 transition-all duration-500 hover:-translate-y-3 hover:scale-110 hover:rotate-1 animate-slide-up bg-gradient-to-br from-white via-[#F9E9D2]/30 to-[#F5E0C8]/30 border-2 border-transparent hover:border-[#F7934C]/40 group">
                  {plan.frequency === 'monthly' && (
                    <Badge className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#F7934C] to-[#e9833e] text-white shadow-xl animate-pulse text-sm font-bold px-4 py-2 rounded-full border-2 border-white">
                      <Crown className="h-4 w-4 mr-1" />
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-4 pt-8">
                    <div className="flex items-center justify-center mb-3">
                      <div className={`p-3 rounded-full transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 ${
                        plan.frequency === 'daily' ? 'bg-blue-100 text-blue-600' :
                        plan.frequency === 'weekly' ? 'bg-green-100 text-green-600' :
                        'bg-gradient-to-r from-[#F7934C] to-[#e9833e] text-white shadow-lg'
                      }`}>
                        {getFrequencyIcon(plan.frequency)}
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-[#3B1F0A] group-hover:text-[#F7934C] transition-colors duration-300">{plan.name}</CardTitle>
                    <CardDescription className="text-[#6E4E29] group-hover:text-[#3B1F0A] transition-colors duration-300">{plan.description}</CardDescription>
                    <div className="mt-4">
                      <div className="text-4xl font-extrabold text-[#F7934C] bg-gradient-to-r from-[#F7934C] to-[#e9833e] bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                        ₹{plan.price}
                        <span className="text-sm font-normal text-[#6E4E29] block">
                          /{plan.frequency}
                        </span>
                      </div>
                      {plan.frequency === 'weekly' && (
                        <div className="text-sm text-green-600 font-semibold mt-1 animate-fade-in">
                          Save 15% vs daily
                        </div>
                      )}
                      {plan.frequency === 'monthly' && (
                        <div className="text-sm text-[#F7934C] font-semibold mt-1 animate-fade-in">
                          Save 25% vs daily
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Features List */}
                    <div className="space-y-2 mb-6">
                      {getPlanFeatures(plan.frequency).map((feature, idx) => (
                        <div key={idx} className="flex items-center space-x-2 animate-fade-in" style={{ animationDelay: `${(index * 0.1) + (idx * 0.05)}s` }}>
                          <Check className="h-4 w-4 text-[#F7934C] animate-bounce" style={{ animationDelay: `${idx * 0.1}s` }} />
                          <span className="text-sm font-medium text-[#6E4E29]">{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Link to="/plans">
                      <Button className={`w-full font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 group-hover:shadow-[#F7934C]/50 ${
                        plan.frequency === 'monthly'
                          ? 'bg-gradient-to-r from-[#F7934C] to-[#e9833e] hover:from-[#e9833e] hover:to-[#d9732a] text-white'
                          : 'bg-white hover:bg-[#F9E9D2] text-[#3B1F0A] border-2 border-[#F7934C]/30 hover:border-[#F7934C] group-hover:bg-[#F7934C] group-hover:text-white'
                      }`}>
                        <Crown className="h-4 w-4 mr-2" />
                        Choose {plan.name}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Items */}
      <section className="py-16 bg-gradient-to-br from-background via-[#FFF7EE]/30 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F7934C]/3 to-transparent"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 animate-fade-in">Featured Items</h2>
            <p className="text-lg text-[#6E4E29] mb-8 animate-fade-in-delayed">
              Popular dishes loved by our customers
            </p>
            <div className="max-w-md w-full mx-auto relative px-4 animate-fade-in-delayed-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full shadow-md hover:shadow-lg transition-shadow duration-300 focus:shadow-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredItems.map((item, index) => (
              <div key={item.id}>
                <Card className={`group relative overflow-hidden bg-gradient-to-br from-white via-orange-50 to-orange-100 border-2 border-transparent hover:border-orange-200 shadow-lg hover:shadow-2xl hover:shadow-orange-200/50 transition-all duration-500 hover:-translate-y-2 hover:scale-105 rounded-xl animate-slide-up h-full flex flex-col ${index % 3 === 1 ? 'animate-slide-up-delayed' : index % 3 === 2 ? 'animate-slide-up-delayed-2' : ''}`}>
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>

                <div className="aspect-video bg-gradient-to-br from-orange-100 to-orange-200 rounded-t-lg flex items-center justify-center overflow-hidden relative">
                  {item.images && item.images.length > 0 ? (
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <ChefHat className="h-12 w-12 text-orange-400" />
                  )}
                  {/* Image overlay */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                      <Plus className="h-6 w-6 text-orange-500" />
                    </div>
                  </div>
                </div>

                <CardHeader className="relative z-20">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-gray-800 group-hover:text-orange-600 transition-colors duration-300">{item.name}</CardTitle>
                    <div className="flex items-center space-x-1 transform group-hover:scale-110 transition-transform duration-300">
                      {item.is_veg ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200 transition-colors duration-300 animate-pulse">
                          <Leaf className="h-3 w-3 mr-1" />
                          Veg
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200 hover:bg-red-200 transition-colors duration-300 animate-pulse">
                          Non-Veg
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-gray-600 group-hover:text-gray-700 transition-colors duration-300 line-clamp-4">{item.description}</CardDescription>
                </CardHeader>

                <CardContent className="relative z-20 flex flex-col justify-between flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-orange-600 group-hover:text-orange-700 transition-colors duration-300">₹{item.price}</span>
                    <div className="flex items-center space-x-1 text-yellow-500 group-hover:text-yellow-600 transition-colors duration-300">
                      <Star className="h-4 w-4 fill-current animate-pulse" />
                      <span className="text-sm text-muted-foreground font-medium">4.5</span>
                    </div>
                  </div>
                  <Button
                    className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300 group-hover:shadow-orange-300/50"
                    onClick={() => addToCart({
                      item_id: item.id,
                      name: item.name,
                      price: item.price,
                      image: item.images?.[0],
                      is_veg: item.is_veg
                    })}
                  >
                    <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No items found matching your search.</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/menu">
              <Button size="lg" variant="outline" className="shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                View Full Menu
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}