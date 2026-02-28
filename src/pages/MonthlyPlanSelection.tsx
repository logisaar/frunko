import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Minus, Copy, ShoppingCart, Leaf, TrendingUp, ChefHat } from 'lucide-react';
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
      const data = await api.getItems();
      // Map camelCase to snake_case for the frontend type
      const mappedData = data
        .filter(item => item.isAvailable)
        .map(item => ({ ...item, is_veg: item.isVeg }));

      setMenuItems(mappedData || []);
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 pt-16 md:pt-20 pb-36 md:pb-24">
      <div className="container mx-auto px-3 md:px-4">
        <div className="mb-4 md:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-2">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900">Monthly Menu Selection</h1>
            <Badge className="bg-green-800 text-white">
              <TrendingUp className="h-3 w-3 mr-1" />
              Save ₹{calculateSavings()}
            </Badge>
          </div>
          <p className="text-sm md:text-base text-gray-600">Plan: {plan?.name} - ₹{plan?.price}/month</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Week</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedWeek} onValueChange={setSelectedWeek}>
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1">
                    {WEEKS.map(week => (
                      <TabsTrigger key={week} value={week} className="text-xs sm:text-sm flex-col sm:flex-row gap-1 py-2">
                        <span>{week}</span>
                        <Badge variant="outline" className="text-[10px] sm:text-xs">
                          ₹{getWeekTotal(week)}
                        </Badge>
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {WEEKS.map(week => (
                    <TabsContent key={week} value={week} className="space-y-3 md:space-y-4 mt-4 md:mt-6">
                      <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => useWeeklyTemplate(week)}
                          className="text-xs md:text-sm h-auto py-1.5 md:py-2"
                        >
                          <Copy className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                          <span className="hidden sm:inline">Use as Template for All Weeks</span>
                          <span className="sm:hidden">Template</span>
                        </Button>
                      </div>

                      <Tabs value={selectedDay} onValueChange={setSelectedDay}>
                        <TabsList className="grid w-full grid-cols-7 gap-0.5 md:gap-1 p-0.5 md:p-1">
                          {DAYS.map(day => (
                            <TabsTrigger key={day} value={day} className="text-[10px] sm:text-xs md:text-sm py-1.5 md:py-2 px-0.5 sm:px-1 md:px-3">
                              <span className="hidden xs:inline">{day.substring(0, 3)}</span>
                              <span className="xs:hidden">{day.substring(0, 1)}</span>
                            </TabsTrigger>
                          ))}
                        </TabsList>

                        {DAYS.map(day => (
                          <TabsContent key={day} value={day} className="space-y-3 md:space-y-4 mt-4 md:mt-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 md:mb-4 gap-2">
                              <h3 className="text-base md:text-lg lg:text-xl font-bold">{week} - {day}</h3>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyDayToWeek(day, week)}
                                className="text-xs md:text-sm h-auto py-1.5 md:py-2 w-full sm:w-auto"
                              >
                                <Copy className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                                <span className="hidden sm:inline">Copy to All Days</span>
                                <span className="sm:hidden">Copy All</span>
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                              {menuItems.map(item => {
                                const quantity = monthSelection[week][day][item.id] || 0;
                                return (
                                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                    <div className="relative h-36 sm:h-40 md:h-48 bg-gradient-to-br from-orange-100 to-orange-200">
                                      {item.images && item.images.length > 0 && item.images[0] ? (
                                        <img
                                          src={getImageUrl(item.images[0])}
                                          alt={item.name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <ChefHat className="h-16 w-16 text-orange-400" />
                                        </div>
                                      )}
                                      {item.is_veg && (
                                        <Badge className="absolute top-2 right-2 bg-green-600">
                                          <Leaf className="h-3 w-3" />
                                        </Badge>
                                      )}
                                    </div>
                                    <CardHeader className="p-3 md:p-6">
                                      <CardTitle className="text-base md:text-lg">{item.name}</CardTitle>
                                      <CardDescription className="text-xs md:text-sm line-clamp-2">{item.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
                                      <div className="flex items-center justify-between">
                                        <span className="text-lg md:text-xl font-bold text-orange-600">₹{item.price}</span>
                                        <div className="flex items-center gap-1.5 md:gap-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => updateQuantity(week, day, item.id, -1)}
                                            disabled={quantity === 0}
                                            className="h-8 w-8 md:h-9 md:w-9 p-0"
                                          >
                                            <Minus className="h-3 w-3 md:h-4 md:w-4" />
                                          </Button>
                                          <span className="w-6 md:w-8 text-center text-sm md:text-base font-semibold">{quantity}</span>
                                          <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() => updateQuantity(week, day, item.id, 1)}
                                            className="h-8 w-8 md:h-9 md:w-9 p-0"
                                          >
                                            <Plus className="h-3 w-3 md:h-4 md:w-4" />
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
            <Card className="lg:sticky lg:top-24 shadow-xl mb-4 lg:mb-0">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-3 md:p-6">
                <CardTitle className="flex items-center gap-2 text-sm md:text-base lg:text-lg">
                  <ShoppingCart className="h-5 w-5" />
                  Monthly Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 md:p-6 pt-3 md:pt-6 space-y-2 md:space-y-3 lg:space-y-4">
                <div className="space-y-2 md:space-y-3">
                  {WEEKS.map(week => {
                    const weekTotal = getWeekTotal(week);
                    return (
                      <div key={week} className="p-2 md:p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center mb-1.5 md:mb-2">
                          <p className="font-semibold text-xs md:text-sm">{week}</p>
                          <span className="font-bold text-xs md:text-sm text-orange-600">₹{weekTotal}</span>
                        </div>
                        <div className="grid grid-cols-7 gap-0.5 md:gap-1 text-[10px] md:text-xs">
                          {DAYS.map(day => {
                            const dayTotal = getDayTotal(week, day);
                            return (
                              <div key={day} className="text-center">
                                <div className="font-medium text-[10px] md:text-xs">{day[0]}</div>
                                <div className="text-gray-600 text-[9px] md:text-[10px]">₹{dayTotal}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t pt-2 md:pt-4 space-y-1.5 md:space-y-2">
                  <div className="flex justify-between text-xs md:text-sm">
                    <span>Total Items:</span>
                    <span className="font-semibold">{getTotalItems()}</span>
                  </div>
                  <div className="flex justify-between text-xs md:text-sm text-green-600">
                    <span>Monthly Savings:</span>
                    <span className="font-semibold">₹{calculateSavings()}</span>
                  </div>
                </div>

                <div className="border-t pt-3 md:pt-4">
                  <div className="flex justify-between items-center mb-3 md:mb-4">
                    <span className="text-base md:text-lg font-semibold">Monthly Total:</span>
                    <span className="text-xl md:text-2xl font-bold text-orange-600">
                      ₹{getMonthlyTotal()}
                    </span>
                  </div>

                  <Button
                    className="w-full h-10 md:h-12 text-sm md:text-base lg:text-lg font-semibold bg-gradient-to-r from-orange-500 to-orange-600"
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
