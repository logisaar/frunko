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
  applyCoupon: (code: string) => boolean;
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
    try { localStorage.setItem('cart_coupon', JSON.stringify(coupon)); } catch {}
  }, [items]);

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
      applyCoupon: (code: string) => {
        // simple coupon: FRUNKO5 -> 5% off
        if (!code) return false;
        const normalized = code.trim().toUpperCase();
        if (normalized === 'FRUNKO5') {
          setCoupon({ code: normalized, percent: 5 });
          try { localStorage.setItem('cart_coupon', JSON.stringify({ code: normalized, percent: 5 })); } catch {}
          toast.success('Coupon applied: 5% off');
          return true;
        }
        toast.error('Invalid coupon');
        return false;
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
