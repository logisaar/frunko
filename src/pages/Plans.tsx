import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Crown,
  Check,
  Clock,
  Star,
  Zap,
  Shield,
  Heart,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type Plan = Database['public']['Tables']['plans']['Row'];

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error('Error loading plans:', error);
      
      // Handle JWT expired error  
      if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
        toast.error('Session expired. Please sign in again.');
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
      } else {
        toast.error('Failed to load subscription plans');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (plan: Plan) => {
    // Check if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Please sign in to subscribe');
      navigate('/auth');
      return;
    }

    // Navigate to plan selection pages based on frequency
    if (plan.frequency === 'weekly') {
      navigate('/weekly-plan-selection', { state: { plan } });
    } else if (plan.frequency === 'monthly') {
      navigate('/monthly-plan-selection', { state: { plan } });
    } else {
      // For daily plans, go directly to payment
      navigate(`/payment?planId=${plan.id}&name=${encodeURIComponent(plan.name)}&price=${plan.price}&frequency=${plan.frequency}`);
    }
  };

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case 'daily': return <Clock className="h-5 w-5" />;
      case 'weekly': return <Star className="h-5 w-5" />;
      case 'monthly': return <Crown className="h-5 w-5" />;
      default: return <Crown className="h-5 w-5" />;
    }
  };

  const getPlanFeatures = (frequency: string) => {
    const baseFeatures = [
      'Fresh ingredients daily',
      'Expert chef preparation',
      'Free delivery',
      'Cancel anytime'
    ];

    switch (frequency) {
      case 'daily':
        return [
          ...baseFeatures,
          'Same-day delivery',
          'Flexible meal timing'
        ];
      case 'weekly':
        return [
          ...baseFeatures,
          'Weekly meal planning',
          'Bulk discount savings'
        ];
      case 'monthly':
        return [
          ...baseFeatures,
          'Monthly meal planning',
          'Maximum savings',
          'Priority support',
          'Custom meal preferences'
        ];
      default:
        return baseFeatures;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-bg via-orange-50 to-yellow-50 mobile-nav-spacing">
      {/* Header */}
      <div className="p-4 text-center">
        <div className="animate-fade-in">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4 animate-pulse" />
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Choose Your Perfect Plan
          </h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Save more with longer commitments and enjoy fresh, healthy meals delivered to your door
          </p>
        </div>
      </div>

      {/* Plans */}
      <div className="px-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl animate-fade-in group ${
                plan.frequency === 'monthly'
                  ? 'bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 border-primary/30 shadow-lg'
                  : 'bg-white/80 backdrop-blur-sm border-gray-200/50 hover:border-primary/20'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.frequency === 'monthly' && (
                <Badge className="absolute top-4 right-4 bg-green-800 text-white z-10 animate-pulse shadow-lg">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Most Popular
                </Badge>
              )}

              <CardHeader className="text-center pb-4 pt-8">
                <div className="flex items-center justify-center mb-4">
                  <div className={`p-3 rounded-full ${
                    plan.frequency === 'daily' ? 'bg-blue-100 text-blue-600' :
                    plan.frequency === 'weekly' ? 'bg-green-100 text-green-600' :
                    'bg-gradient-to-r from-primary to-secondary text-white'
                  } transition-transform group-hover:scale-110`}>
                    {getFrequencyIcon(plan.frequency)}
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-base">
                  {plan.description}
                </CardDescription>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-primary">
                    ₹{plan.price}
                  </span>
                  <span className="text-muted-foreground ml-1 text-lg">
                    /{plan.frequency}
                  </span>
                  {plan.frequency === 'weekly' && (
                    <div className="text-sm text-green-600 font-medium mt-1">
                      Save 15% vs daily
                    </div>
                  )}
                  {plan.frequency === 'monthly' && (
                    <div className="text-sm text-primary font-medium mt-1">
                      Save 25% vs daily
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0 px-6 pb-6">
                {/* Features */}
                <div className="space-y-3 mb-6">
                  {getPlanFeatures(plan.frequency).map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-3 animate-fade-in" style={{ animationDelay: `${(index * 0.1) + (idx * 0.05)}s` }}>
                      <div className="flex-shrink-0">
                        <Check className="h-5 w-5 text-primary animate-bounce" style={{ animationDelay: `${idx * 0.1}s` }} />
                      </div>
                      <span className="text-sm font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Benefits */}
                <div className="bg-gradient-to-r from-muted/20 to-muted/10 rounded-xl p-4 mb-6 border border-muted/30">
                  <div className="flex items-center space-x-2 mb-3">
                    <Zap className="h-5 w-5 text-primary animate-pulse" />
                    <span className="text-sm font-semibold">Exclusive Benefits</span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-2">
                    {plan.frequency === 'daily' && (
                      <>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span>Perfect for trying new dishes</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                          <span>Maximum flexibility</span>
                        </div>
                      </>
                    )}
                    {plan.frequency === 'weekly' && (
                      <>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                          <span>15% savings vs daily orders</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                          <span>Weekly meal variety</span>
                        </div>
                      </>
                    )}
                    {plan.frequency === 'monthly' && (
                      <>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span>25% savings vs daily orders</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span>Priority customer support</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                          <span>Custom dietary preferences</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  className={`w-full h-12 text-lg font-semibold transition-all duration-300 ${
                    plan.frequency === 'monthly'
                      ? 'bg-orange-500 hover:from-primary/90 hover:to-seconedary/90 shadow-lg hover:shadow-xl transform hover:scale-105'
                      : 'hover:bg-primary hover:text-white border-2 border-primary hover:border-primary'
                  }`}
                  onClick={() => handleSelectPlan(plan)}
                >
                  <Crown className="h-5 w-5 mr-2" />
                  Choose {plan.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 max-w-4xl mx-auto">
        <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 border-primary/30 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 animate-fade-in">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Shield className="h-8 w-8 text-primary mt-0.5 flex-shrink-0 animate-pulse" />
              <div>
                <h3 className="font-bold text-lg mb-2 text-primary">Money Back Guarantee</h3>
                <p className="text-base text-muted-foreground">
                  Not satisfied with your first meal? Get a full refund within 24 hours.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/10 via-secondary/5 to-primary/10 border-secondary/30 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Heart className="h-8 w-8 text-secondary mt-0.5 flex-shrink-0 animate-pulse" />
              <div>
                <h3 className="font-bold text-lg mb-2 text-secondary">Health First</h3>
                <p className="text-base text-muted-foreground">
                  All meals are prepared with fresh, locally sourced ingredients and follow strict hygiene standards.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
