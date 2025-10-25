import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  item_id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  is_veg: boolean;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  loading: boolean;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  coupon: { code?: string; percent: number } | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [coupon, setCoupon] = useState<{ code?: string; percent: number } | null>(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse saved cart:', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  // Save coupon separately
  useEffect(() => {
    try { 
      if (coupon) {
        localStorage.setItem('cart_coupon', JSON.stringify(coupon)); 
      } else {
        localStorage.removeItem('cart_coupon');
      }
    } catch {}
  }, [coupon]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cart_coupon');
      if (saved) setCoupon(JSON.parse(saved));
    } catch {}
  }, []);

  const addToCart = (item: Omit<CartItem, 'id' | 'quantity'>) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(cartItem => cartItem.item_id === item.item_id);
      
      if (existingItem) {
        return prevItems.map(cartItem =>
          cartItem.item_id === item.item_id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        const newItem: CartItem = {
          ...item,
          id: `${item.item_id}-${Date.now()}`,
          quantity: 1
        };
        return [...prevItems, newItem];
      }
    });
    toast.success('Added to cart!');
  };

  const removeFromCart = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
    toast.success('Removed from cart!');
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    toast.success('Cart cleared!');
  };

  const getTotalPrice = () => {
    const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
    if (coupon && coupon.percent) {
      const discount = subtotal * (coupon.percent / 100);
      return Math.round((subtotal - discount) * 100) / 100;
    }
    return Math.round(subtotal * 100) / 100;
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalPrice,
      getTotalItems,
      loading
      ,
      applyCoupon: async (code: string) => {
        if (!code) return false;
        const normalized = code.trim().toUpperCase();
        
        try {
          // Check database for valid coupon
          const { data: coupon, error } = await supabase
            .from('coupon_codes')
            .select('*')
            .eq('code', normalized)
            .eq('is_active', true)
            .single();

          if (error || !coupon) {
            toast.error('Invalid coupon code');
            return false;
          }

          // Check if coupon is still valid
          const now = new Date();
          if (coupon.valid_until && new Date(coupon.valid_until) < now) {
            toast.error('This coupon has expired');
            return false;
          }

          // Check usage limit
          if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
            toast.error('This coupon has reached its usage limit');
            return false;
          }

          // Calculate discount percentage
          const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
          let discount = 0;
          
          if (coupon.discount_type === 'percentage') {
            discount = (subtotal * coupon.discount_value) / 100;
            if (coupon.max_discount) {
              discount = Math.min(discount, coupon.max_discount);
            }
          } else {
            discount = coupon.discount_value;
          }

          const discountPercent = subtotal > 0 ? (discount / subtotal) * 100 : 0;

          setCoupon({ code: normalized, percent: discountPercent });
          toast.success(`Coupon applied: ${Math.round(discountPercent)}% off`);
          return true;
        } catch (error) {
          console.error('Error applying coupon:', error);
          toast.error('Failed to apply coupon');
          return false;
        }
      },
      removeCoupon: () => {
        setCoupon(null);
        try { localStorage.removeItem('cart_coupon'); } catch {}
        toast('Coupon removed');
      },
      coupon
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
