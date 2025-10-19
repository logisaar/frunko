import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  UtensilsCrossed, 
  ShoppingCart, 
  User,
  Crown,
  Star
} from 'lucide-react';

export default function MobileNavigation() {
  const { user } = useAuth();
  const { getTotalItems } = useCart();
  const location = useLocation();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/menu', label: 'Menu', icon: UtensilsCrossed },
    { href: '/plans', label: 'Plans', icon: Crown },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  if (!user) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = location.pathname === href;
          
          return (
            <Link
              key={href}
              to={href}
              className={`flex flex-col items-center justify-center space-y-1 px-1 py-1 rounded-lg transition-colors touch-target ${
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
        
        {/* Cart with badge */}
        <Link
          to="/cart"
          className={`flex flex-col items-center justify-center space-y-1 px-1 py-1 rounded-lg transition-colors touch-target ${
            location.pathname === '/cart'
              ? 'text-primary bg-primary/10' 
              : 'text-muted-foreground hover:text-primary'
          }`}
        >
          <div className="relative">
            <ShoppingCart className="h-4 w-4" />
            {getTotalItems() > 0 && (
              <Badge className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 text-xs">
                {getTotalItems()}
              </Badge>
            )}
          </div>
          <span className="text-xs font-medium">Cart</span>
        </Link>
      </div>
    </nav>
  );
}
