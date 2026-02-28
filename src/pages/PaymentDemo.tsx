import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, CheckCircle2, Package, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';

declare global {
  interface Window {
    Paytm?: {
      CheckoutJS: {
        init: (config: any) => Promise<void>;
        invoke: () => void;
      };
    };
  }
}

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function PaymentPage() {
  const query = useQuery();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [loading, setLoading] = useState(false);

  // Check for callback status from Paytm redirect
  const callbackStatus = query.get('status');
  const callbackOrderId = query.get('orderId');
  const callbackTxnId = query.get('txnId');

  // Order data passed from Cart
  const orderData = location.state;
  const isOrder = orderData?.orderId && orderData?.totalAmount;

  // Plan data from query string
  const name = query.get('name') || 'Selected Plan';
  const price = Number(query.get('price') || 0);
  const frequency = query.get('frequency') || 'monthly';

  const total = isOrder ? orderData.totalAmount : price;
  const displayTitle = callbackStatus ? (callbackStatus === 'success' ? 'Payment Successful!' : 'Payment Failed') : (isOrder ? 'Order Payment' : 'Plan Payment');
  const displayName = isOrder ? `Order #${orderData.orderId.slice(0, 8)}` : name;

  // Clear cart when payment succeeds
  useEffect(() => {
    if (callbackStatus === 'success') {
      clearCart();
    }
  }, [callbackStatus]);

  // If we're on a callback page (redirected from Paytm), show the result
  if (callbackStatus) {
    return (
      <div className="min-h-screen bg-warm-bg mobile-nav-spacing">
        <div className="p-4 max-w-md mx-auto pt-12">
          <Card className="glass text-center">
            <CardContent className="py-10 space-y-6">
              {callbackStatus === 'success' ? (
                <>
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-green-700">Payment Successful!</h2>
                    <p className="text-muted-foreground mt-2">Your order has been confirmed.</p>
                    {callbackTxnId && (
                      <p className="text-xs text-muted-foreground mt-1 font-mono">TXN ID: {callbackTxnId}</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <XCircle className="h-10 w-10 text-red-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-red-700">Payment Failed</h2>
                    <p className="text-muted-foreground mt-2">Something went wrong. Please try again.</p>
                  </div>
                </>
              )}
              <Button className="w-full" onClick={() => navigate('/orders')}>
                <Package className="h-4 w-4 mr-2" />
                View My Orders
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handlePayment = async () => {
    if (!isOrder) {
      toast.error('No order data found');
      return;
    }

    setLoading(true);
    try {
      // 1. Call backend to initiate Paytm transaction
      const data = await api.initiatePaytmPayment(
        orderData.orderId,
        total,
        user?.email,
        user?.phone,
      );

      // 2. Open Paytm Checkout
      if (window.Paytm && window.Paytm.CheckoutJS) {
        const config = {
          root: '',
          flow: 'DEFAULT',
          data: {
            orderId: data.orderId,
            token: data.txnToken,
            tokenType: 'TXN_TOKEN',
            amount: data.amount,
          },
          merchant: {
            mid: data.mid,
            redirect: true,
          },
          handler: {
            notifyMerchant: (eventName: string, eventData: any) => {
              console.log('Paytm event:', eventName, eventData);
            },
          },
        };

        await window.Paytm.CheckoutJS.init(config);
        window.Paytm.CheckoutJS.invoke();
      } else {
        toast.error('Paytm SDK not loaded. Please refresh and try again.');
      }
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      toast.error(error.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-bg mobile-nav-spacing">
      <div className="p-4 max-w-md mx-auto">
        <Card className="glass">
          <CardHeader>
            <CardTitle>{displayTitle}</CardTitle>
            <CardDescription>
              {isOrder ? 'Complete your order payment via Paytm' : 'Confirm your plan and pay via Paytm'}
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
                    <div className="text-sm text-muted-foreground">Order payment via Paytm</div>
                  )}
                </div>
                <div className="text-lg font-bold">₹{total}</div>
              </div>
            </div>

            <Button className="w-full" onClick={handlePayment} disabled={loading || !isOrder}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Initiating Payment...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay ₹{total} with Paytm
                </>
              )}
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
