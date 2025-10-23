import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, Copy, ShoppingCart, Leaf, TrendingUp } from 'lucide-react';
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

interface MonthSelection {
  [week: string]: WeekSelection;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const WEEKS = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

export default function MonthlyPlanSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = location.state?.plan;

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [monthSelection, setMonthSelection] = useState<MonthSelection>(
    WEEKS.reduce((acc, week) => ({
      ...acc,
      [week]: DAYS.reduce((dayAcc, day) => ({ ...dayAcc, [day]: {} }), {})
    }), {})
  );
  const [selectedWeek, setSelectedWeek] = useState('Week 1');
  const [selectedDay, setSelectedDay] = useState('Monday');
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

  const updateQuantity = (week: string, day: string, itemId: string, change: number) => {
    setMonthSelection(prev => {
      const currentQty = prev[week][day][itemId] || 0;
      const newQty = Math.max(0, currentQty + change);
      
      return {
        ...prev,
        [week]: {
          ...prev[week],
          [day]: {
            ...prev[week][day],
            [itemId]: newQty === 0 ? 0 : newQty
          }
        }
      };
    });
  };

  const getDayTotal = (week: string, day: string) => {
    const dayItems = monthSelection[week][day];
    return Object.entries(dayItems).reduce((sum, [itemId, qty]) => {
      const item = menuItems.find(i => i.id === itemId);
      return sum + (item?.price || 0) * qty;
    }, 0);
  };

  const getWeekTotal = (week: string) => {
    return DAYS.reduce((sum, day) => sum + getDayTotal(week, day), 0);
  };

  const getMonthlyTotal = () => {
    return WEEKS.reduce((sum, week) => sum + getWeekTotal(week), 0);
  };

  const getTotalItems = () => {
    return WEEKS.reduce((sum, week) => {
      return sum + DAYS.reduce((daySum, day) => {
        return daySum + Object.values(monthSelection[week][day]).reduce((a, b) => a + b, 0);
      }, 0);
    }, 0);
  };

  const useWeeklyTemplate = (templateWeek: string) => {
    const template = monthSelection[templateWeek];
    setMonthSelection(prev => {
      const newSelection = { ...prev };
      WEEKS.forEach(week => {
        newSelection[week] = JSON.parse(JSON.stringify(template));
      });
      return newSelection;
    });
    toast.success(`Applied ${templateWeek} template to all weeks`);
  };

  const copyDayToWeek = (sourceDay: string, targetWeek: string) => {
    const sourceDaySelection = monthSelection[selectedWeek][sourceDay];
    setMonthSelection(prev => ({
      ...prev,
      [targetWeek]: {
        ...prev[targetWeek],
        ...DAYS.reduce((acc, day) => ({
          ...acc,
          [day]: { ...sourceDaySelection }
        }), {})
      }
    }));
    toast.success(`Copied ${sourceDay} to all days in ${targetWeek}`);
  };

  const handleCheckout = () => {
    const selections = WEEKS.map(week => ({
      week,
      days: DAYS.map(day => ({
        day,
        items: Object.entries(monthSelection[week][day])
          .filter(([_, qty]) => qty > 0)
          .map(([itemId, qty]) => ({
            item: menuItems.find(i => i.id === itemId),
            quantity: qty
          }))
      }))
    }));

    navigate('/cart', { state: { monthlySelection: selections, plan } });
  };

  const calculateSavings = () => {
    const weeklyPrice = 900; // Assuming weekly plan price
    const potentialWeeklyTotal = weeklyPrice * 4;
    const actualMonthlyPrice = plan?.price || 0;
    return potentialWeeklyTotal - actualMonthlyPrice;
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
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-bold text-gray-900">Monthly Menu Selection</h1>
            <Badge className="bg-green-800 text-white">
              <TrendingUp className="h-3 w-3 mr-1" />
              Save ₹{calculateSavings()}
            </Badge>
          </div>
          <p className="text-gray-600">Plan: {plan?.name} - ₹{plan?.price}/month</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Week</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedWeek} onValueChange={setSelectedWeek}>
                  <TabsList className="grid w-full grid-cols-4">
                    {WEEKS.map(week => (
                      <TabsTrigger key={week} value={week}>
                        {week}
                        <Badge variant="outline" className="ml-2">
                          ₹{getWeekTotal(week)}
                        </Badge>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {WEEKS.map(week => (
                    <TabsContent key={week} value={week} className="space-y-4 mt-6">
                      <div className="flex gap-2 mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => useWeeklyTemplate(week)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Use as Template for All Weeks
                        </Button>
                      </div>

                      <Tabs value={selectedDay} onValueChange={setSelectedDay}>
                        <TabsList className="grid w-full grid-cols-7">
                          {DAYS.map(day => (
                            <TabsTrigger key={day} value={day}>
                              {day.substring(0, 3)}
                            </TabsTrigger>
                          ))}
                        </TabsList>

                        {DAYS.map(day => (
                          <TabsContent key={day} value={day} className="space-y-4 mt-6">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-xl font-bold">{week} - {day}</h3>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyDayToWeek(day, week)}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy to All Days
                              </Button>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                              {menuItems.map(item => {
                                const quantity = monthSelection[week][day][item.id] || 0;
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
                                            onClick={() => updateQuantity(week, day, item.id, -1)}
                                            disabled={quantity === 0}
                                          >
                                            <Minus className="h-4 w-4" />
                                          </Button>
                                          <span className="w-8 text-center font-semibold">{quantity}</span>
                                          <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() => updateQuantity(week, day, item.id, 1)}
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
                          </TabsContent>
                        ))}
                      </Tabs>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Monthly Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  {WEEKS.map(week => {
                    const weekTotal = getWeekTotal(week);
                    return (
                      <div key={week} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <p className="font-semibold">{week}</p>
                          <span className="font-bold text-orange-600">₹{weekTotal}</span>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-xs">
                          {DAYS.map(day => {
                            const dayTotal = getDayTotal(week, day);
                            return (
                              <div key={day} className="text-center">
                                <div className="font-medium">{day[0]}</div>
                                <div className="text-gray-600">₹{dayTotal}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Items:</span>
                    <span className="font-semibold">{getTotalItems()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Monthly Savings:</span>
                    <span className="font-semibold">₹{calculateSavings()}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-lg font-semibold">Monthly Total:</span>
                    <span className="text-2xl font-bold text-orange-600">
                      ₹{getMonthlyTotal()}
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
