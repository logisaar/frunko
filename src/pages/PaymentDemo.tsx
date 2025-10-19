import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, CheckCircle2 } from 'lucide-react';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function PaymentDemo() {
  const query = useQuery();
  const navigate = useNavigate();

  const name = query.get('name') || 'Selected Plan';
  const price = Number(query.get('price') || 0);
  const frequency = query.get('frequency') || 'monthly';

  const total = price; // demo static total

  return (
    <div className="min-h-screen bg-warm-bg mobile-nav-spacing">
      <div className="p-4 max-w-md mx-auto">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Demo Payment</CardTitle>
            <CardDescription>Confirm your plan and simulate payment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{name}</div>
                  <div className="text-sm text-muted-foreground capitalize">Billing: {frequency}</div>
                </div>
                <div className="text-lg font-bold">₹{total}</div>
              </div>
            </div>

            <Button className="w-full" onClick={() => navigate('/profile')}>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay Now (Demo)
            </Button>

            <Button variant="outline" className="w-full" onClick={() => navigate('/plans')}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Back to Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


