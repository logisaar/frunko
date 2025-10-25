import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, CheckCircle2, Package } from 'lucide-react';
import { toast } from 'sonner';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function PaymentDemo() {
  const query = useQuery();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if order data is passed from cart
  const orderData = location.state;
  const isOrder = orderData?.orderId && orderData?.totalAmount;

  const name = query.get('name') || 'Selected Plan';
  const price = Number(query.get('price') || 0);
  const frequency = query.get('frequency') || 'monthly';

  const total = isOrder ? orderData.totalAmount : price;
  const displayTitle = isOrder ? 'Order Payment' : 'Plan Payment';
  const displayName = isOrder ? `Order #${orderData.orderId.slice(0, 8)}` : name;
  
  const handlePayment = () => {
    toast.success('Payment completed successfully! (Demo)');
    setTimeout(() => {
      navigate(isOrder ? '/orders' : '/profile');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-warm-bg mobile-nav-spacing">
      <div className="p-4 max-w-md mx-auto">
        <Card className="glass">
          <CardHeader>
            <CardTitle>{displayTitle}</CardTitle>
            <CardDescription>
              {isOrder ? 'Complete your order payment' : 'Confirm your plan and simulate payment'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{displayName}</div>
                  {!isOrder && (
                    <div className="text-sm text-muted-foreground capitalize">Billing: {frequency}</div>
                  )}
                  {isOrder && (
                    <div className="text-sm text-muted-foreground">Order payment</div>
                  )}
                </div>
                <div className="text-lg font-bold">₹{total}</div>
              </div>
            </div>

            <Button className="w-full" onClick={handlePayment}>
              <CreditCard className="h-4 w-4 mr-2" />
              Pay Now (Demo)
            </Button>

            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate(isOrder ? '/cart' : '/plans')}
            >
              {isOrder ? (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  Back to Cart
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Back to Plans
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


