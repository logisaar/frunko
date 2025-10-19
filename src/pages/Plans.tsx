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
  Heart
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

  const handleSelectPlan = (plan: Plan) => {
    navigate(`/payment?planId=${plan.id}&name=${encodeURIComponent(plan.name)}&price=${plan.price}&frequency=${plan.frequency}`);
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
    <div className="min-h-screen bg-warm-bg mobile-nav-spacing">
      {/* Header */}
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-2">Subscription Plans</h1>
        <p className="text-muted-foreground mb-6">
          Choose the perfect plan for your lifestyle and save more with longer commitments
        </p>
      </div>

      {/* Plans */}
      <div className="p-4 space-y-4">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative overflow-hidden glass">
            {plan.frequency === 'monthly' && (
              <Badge className="absolute top-4 right-4 bg-primary z-10">
                Most Popular
              </Badge>
            )}
            
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-center mb-2">
                {getFrequencyIcon(plan.frequency)}
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription className="text-sm">
                {plan.description}
              </CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold text-primary">
                  ₹{plan.price}
                </span>
                <span className="text-muted-foreground ml-1">
                  /{plan.frequency}
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {/* Features */}
              <div className="space-y-2 mb-6">
                {getPlanFeatures(plan.frequency).map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Benefits */}
              <div className="bg-muted/30 rounded-lg p-3 mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Benefits</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {plan.frequency === 'daily' && (
                    <>
                      <div>• Perfect for trying new dishes</div>
                      <div>• Maximum flexibility</div>
                    </>
                  )}
                  {plan.frequency === 'weekly' && (
                    <>
                      <div>• 15% savings vs daily orders</div>
                      <div>• Weekly meal variety</div>
                    </>
                  )}
                  {plan.frequency === 'monthly' && (
                    <>
                      <div>• 25% savings vs daily orders</div>
                      <div>• Priority customer support</div>
                      <div>• Custom dietary preferences</div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <Button 
                className="w-full" 
                variant={plan.frequency === 'monthly' ? 'default' : 'outline'}
                onClick={() => handleSelectPlan(plan)}
              >
                <Crown className="h-4 w-4 mr-2" />
                Select {plan.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Info */}
      <div className="p-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Money Back Guarantee</h3>
                <p className="text-sm text-muted-foreground">
                  Not satisfied with your first meal? Get a full refund within 24 hours.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-secondary/5 border-secondary/20 mt-4">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Heart className="h-5 w-5 text-secondary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Health First</h3>
                <p className="text-sm text-muted-foreground">
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
