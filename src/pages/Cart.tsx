import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart,
  MapPin,
  CreditCard,
  ChefHat,
  Tag,
  X
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, clearCart, getTotalPrice, getTotalItems, addToCart } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const navigate = useNavigate();

  // Handle weekly selection from WeeklyPlanSelection page
  useEffect(() => {
    const weeklySelection = location.state?.weeklySelection;
    if (weeklySelection && Array.isArray(weeklySelection)) {
      // Add all items from weekly selection to cart
      weeklySelection.forEach(dayData => {
        dayData.items.forEach(({ item, quantity }: any) => {
          if (item && quantity > 0) {
            // Add each item the specified number of times
            for (let i = 0; i < quantity; i++) {
              addToCart({
                item_id: item.id,
                name: item.name,
                price: item.price,
                image: item.images?.[0],
                is_veg: item.is_veg
              });
            }
          }
        });
      });
      toast.success('Weekly menu items added to cart!');
      // Clear the state to prevent re-adding on refresh
      navigate('/cart', { replace: true, state: {} });
    }
  }, [location.state]);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId: string) => {
    removeFromCart(itemId);
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    
    const subtotal = getTotalPrice();
    let discount = 0;

    if (appliedCoupon.discount_type === 'percentage') {
      discount = (subtotal * appliedCoupon.discount_value) / 100;
      if (appliedCoupon.max_discount) {
        discount = Math.min(discount, appliedCoupon.max_discount);
      }
    } else {
      discount = appliedCoupon.discount_value;
    }

    return Math.min(discount, subtotal);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    try {
      const { data: coupon, error } = await supabase
        .from('coupon_codes')
        .select('*')
        .eq('code', couponCode.trim().toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !coupon) {
        toast.error('Invalid or expired coupon code');
        return;
      }

      // Check if coupon is still valid
      const now = new Date();
      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        toast.error('This coupon has expired');
        return;
      }

      // Check minimum order value
      if (coupon.min_order_value && getTotalPrice() < coupon.min_order_value) {
        toast.error(`Minimum order value of ₹${coupon.min_order_value} required`);
        return;
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        toast.error('This coupon has reached its usage limit');
        return;
      }

      setAppliedCoupon(coupon);
      toast.success('Coupon applied successfully!');
    } catch (error) {
      console.error('Error applying coupon:', error);
      toast.error('Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.info('Coupon removed');
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!deliveryAddress.trim()) {
      toast.error('Please enter your delivery address');
      return;
    }

    try {
      const discount = calculateDiscount();
      const subtotal = getTotalPrice();
      const tax = Math.round((subtotal - discount) * 0.18);
      const totalAmount = subtotal - discount + tax;
      
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user!.id,
          total_amount: totalAmount,
          delivery_address: deliveryAddress,
          status: 'pending',
          coupon_code: appliedCoupon?.code || null,
          discount_amount: discount
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: orderData.id,
        item_id: item.item_id,
        quantity: item.quantity,
        price: item.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Record coupon usage if applied
      if (appliedCoupon) {
        await supabase.from('coupon_usage').insert({
          coupon_id: appliedCoupon.id,
          user_id: user!.id,
          order_id: orderData.id,
          discount_amount: discount
        });

        // Update coupon used count
        await supabase
          .from('coupon_codes')
          .update({ used_count: appliedCoupon.used_count + 1 })
          .eq('id', appliedCoupon.id);
      }

      toast.success('Order placed successfully!');
      clearCart();
      navigate('/payment', { 
        state: { 
          orderId: orderData.id,
          totalAmount: totalAmount 
        } 
      });
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error('Failed to place order. Please try again.');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-warm-bg pb-20">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Your Cart</h1>
          
          <div className="flex flex-col items-center justify-center py-20">
            <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground text-center mb-6">
              Add some delicious items from our menu to get started
            </p>
            <Button onClick={() => navigate('/menu')}>
              Browse Menu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-bg mobile-nav-spacing">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Your Cart</h1>
          <Button variant="outline" size="sm" onClick={clearCart}>
            Clear All
          </Button>
        </div>

        {/* Cart Items */}
        <div className="space-y-3 mb-6">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  {/* Image */}
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.image ? (
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <ChefHat className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">₹{item.price} each</p>
                    <div className="flex items-center space-x-2 mt-1">
                      {item.is_veg ? (
                        <Badge variant="secondary" className="bg-secondary/20 text-secondary text-xs">
                          Veg
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-destructive/20 text-destructive text-xs">
                          Non-Veg
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Item Total */}
                <div className="flex justify-between items-center mt-3 pt-3 border-t">
                  <span className="text-sm text-muted-foreground">
                    {item.quantity} × ₹{item.price}
                  </span>
                  <span className="font-semibold">₹{item.price * item.quantity}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Delivery Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Delivery Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Delivery Address *</Label>
              <Textarea
                id="address"
                placeholder="Enter your complete delivery address..."
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instructions">Special Instructions (Optional)</Label>
              <Textarea
                id="instructions"
                placeholder="Any special instructions for delivery..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        {/* Coupon Code Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Have a Coupon?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="font-semibold text-green-700">{appliedCoupon.code}</p>
                  <p className="text-sm text-green-600">
                    You saved ₹{calculateDiscount()}!
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCoupon}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="uppercase"
                />
                <Button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                >
                  Apply
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Items ({getTotalItems()})</span>
              <span>₹{getTotalPrice()}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-₹{calculateDiscount()}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="text-green-600">Free</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (18%)</span>
              <span>₹{Math.round((getTotalPrice() - calculateDiscount()) * 0.18)}</span>
            </div>
            <div className="border-t pt-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₹{getTotalPrice() - calculateDiscount() + Math.round((getTotalPrice() - calculateDiscount()) * 0.18)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Checkout Button */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={handleCheckout}
        >
          <CreditCard className="h-5 w-5 mr-2" />
          Place Order - ₹{getTotalPrice() - calculateDiscount() + Math.round((getTotalPrice() - calculateDiscount()) * 0.18)}
        </Button>
      </div>
    </div>
  );
}
