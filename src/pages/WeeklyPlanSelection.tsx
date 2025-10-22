import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, Copy, SkipForward, ShoppingCart, Leaf, Check } from 'lucide-react';
import { toast } from 'sonner';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  is_veg: boolean;
  category: string;
}

interface DaySelection {
  [itemId: string]: number;
}

interface WeekSelection {
  [day: string]: DaySelection;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function WeeklyPlanSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = location.state?.plan;

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [weekSelection, setWeekSelection] = useState<WeekSelection>(
    DAYS.reduce((acc, day) => ({ ...acc, [day]: {} }), {})
  );
  const [skippedDays, setSkippedDays] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!plan) {
      navigate('/plans');
      return;
    }
    fetchMenuItems();
  }, [plan, navigate]);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('is_available', true)
        .order('name');

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (day: string, itemId: string, change: number) => {
    setWeekSelection(prev => {
      const currentQty = prev[day][itemId] || 0;
      const newQty = Math.max(0, currentQty + change);
      
      return {
        ...prev,
        [day]: {
          ...prev[day],
          [itemId]: newQty === 0 ? 0 : newQty
        }
      };
    });
  };

  const getDayTotal = (day: string) => {
    const dayItems = weekSelection[day];
    return Object.entries(dayItems).reduce((sum, [itemId, qty]) => {
      const item = menuItems.find(i => i.id === itemId);
      return sum + (item?.price || 0) * qty;
    }, 0);
  };

  const getWeeklyTotal = () => {
    return DAYS.reduce((sum, day) => {
      if (skippedDays.has(day)) return sum;
      return sum + getDayTotal(day);
    }, 0);
  };

  const getTotalItems = () => {
    return DAYS.reduce((sum, day) => {
      if (skippedDays.has(day)) return sum;
      return sum + Object.values(weekSelection[day]).reduce((a, b) => a + b, 0);
    }, 0);
  };

  const copyToAllDays = (sourceDay: string) => {
    const sourceDaySelection = weekSelection[sourceDay];
    setWeekSelection(prev => {
      const newSelection = { ...prev };
      DAYS.forEach(day => {
        if (!skippedDays.has(day)) {
          newSelection[day] = { ...sourceDaySelection };
        }
      });
      return newSelection;
    });
    toast.success(`Copied ${sourceDay}'s selection to all active days`);
  };

  const toggleSkipDay = (day: string) => {
    setSkippedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(day)) {
        newSet.delete(day);
        toast.success(`${day} activated`);
      } else {
        newSet.add(day);
        toast.info(`${day} skipped`);
      }
      return newSet;
    });
  };

  const handleCheckout = () => {
    const selections = DAYS.filter(day => !skippedDays.has(day)).map(day => ({
      day,
      items: Object.entries(weekSelection[day])
        .filter(([_, qty]) => qty > 0)
        .map(([itemId, qty]) => ({
          item: menuItems.find(i => i.id === itemId),
          quantity: qty
        }))
    }));

    navigate('/cart', { state: { weeklySelection: selections, plan } });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading menu...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 pt-20 pb-24">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Weekly Menu Selection</h1>
          <p className="text-gray-600">Plan: {plan?.name} - ₹{plan?.price}/week</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs defaultValue="Monday" className="w-full">
              <TabsList className="grid w-full grid-cols-7 mb-6">
                {DAYS.map(day => (
                  <TabsTrigger 
                    key={day} 
                    value={day}
                    className="relative"
                  >
                    {day.substring(0, 3)}
                    {skippedDays.has(day) && (
                      <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 bg-red-500" />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {DAYS.map(day => (
                <TabsContent key={day} value={day} className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{day}</h2>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToAllDays(day)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy to All Days
                      </Button>
                      <Button
                        variant={skippedDays.has(day) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleSkipDay(day)}
                      >
                        <SkipForward className="h-4 w-4 mr-2" />
                        {skippedDays.has(day) ? 'Activate' : 'Skip Day'}
                      </Button>
                    </div>
                  </div>

                  {skippedDays.has(day) ? (
                    <Card className="p-12 text-center">
                      <p className="text-gray-500">This day is skipped</p>
                    </Card>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {menuItems.map(item => {
                        const quantity = weekSelection[day][item.id] || 0;
                        return (
                          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="relative h-48">
                              <img
                                src={item.images[0] || '/placeholder.svg'}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                              {item.is_veg && (
                                <Badge className="absolute top-2 right-2 bg-green-600">
                                  <Leaf className="h-3 w-3" />
                                </Badge>
                              )}
                            </div>
                            <CardHeader>
                              <CardTitle className="text-lg">{item.name}</CardTitle>
                              <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center justify-between">
                                <span className="text-xl font-bold text-orange-600">₹{item.price}</span>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateQuantity(day, item.id, -1)}
                                    disabled={quantity === 0}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="w-8 text-center font-semibold">{quantity}</span>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => updateQuantity(day, item.id, 1)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Day Total:</span>
                        <span className="text-2xl font-bold text-orange-600">
                          ₹{getDayTotal(day)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Weekly Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  {DAYS.map(day => {
                    const dayTotal = getDayTotal(day);
                    const dayItemCount = Object.values(weekSelection[day]).reduce((a, b) => a + b, 0);
                    const isSkipped = skippedDays.has(day);
                    
                    return (
                      <div key={day} className={`flex justify-between items-center p-2 rounded ${isSkipped ? 'opacity-50 line-through' : ''}`}>
                        <div>
                          <p className="font-medium">{day}</p>
                          <p className="text-xs text-gray-500">{dayItemCount} items</p>
                        </div>
                        <span className="font-semibold">₹{dayTotal}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Items:</span>
                    <span className="font-semibold">{getTotalItems()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Active Days:</span>
                    <span className="font-semibold">{DAYS.length - skippedDays.size}/7</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Weekly Total:</span>
                    <span className="text-2xl font-bold text-orange-600">
                      ₹{getWeeklyTotal()}
                    </span>
                  </div>

                  <Button
                    className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-orange-500 to-orange-600"
                    onClick={handleCheckout}
                    disabled={getTotalItems() === 0}
                  >
                    Proceed to Checkout
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
