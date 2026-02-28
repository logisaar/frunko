import { Link, useLocation } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { ShoppingBag, ChevronRight } from 'lucide-react';

export default function FloatingCartBanner() {
    const { items, getTotalPrice, getTotalItems } = useCart();
    const location = useLocation();

    // Do not show the banner on these pages
    const hiddenPaths = ['/cart', '/admin', '/auth', '/payment'];
    if (hiddenPaths.some(path => location.pathname.startsWith(path))) {
        return null;
    }

    const totalItems = getTotalItems();

    if (totalItems === 0) {
        return null;
    }

    return (
        <div className="fixed bottom-16 md:bottom-4 left-4 right-4 z-40 animate-slide-up">
            <Link to="/cart">
                <div className="bg-gradient-to-r from-[#16A34A] to-[#15803D] hover:from-[#22C55E] hover:to-[#16A34A] text-white rounded-2xl shadow-[0_8px_30px_rgba(22,163,74,0.4)] hover:shadow-[0_12px_40px_rgba(22,163,74,0.5)] p-4 flex items-center justify-between transition-all duration-300 transform hover:scale-[1.02] border border-[#15803D]/40">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <ShoppingBag className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg leading-tight">{totalItems} {totalItems === 1 ? 'Item' : 'Items'}</span>
                            <span className="text-white/90 text-sm font-medium">₹{getTotalPrice()} plus taxes</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 font-bold text-lg tracking-wide">
                        View Cart
                        <ChevronRight className="w-5 h-5 ml-1 animate-pulse" />
                    </div>
                </div>
            </Link>
        </div>
    );
}
