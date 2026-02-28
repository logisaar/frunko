import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import Navigation from "@/components/Navigation";
import MobileNavigation from "@/components/MobileNavigation";
import AdminAccess from "@/components/AdminAccess";
import FloatingCartBanner from "@/components/FloatingCartBanner";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Plans from "./pages/Plans";
import Cart from "./pages/Cart";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import PaymentDemo from "./pages/PaymentDemo";
import WeeklyPlanSelection from "./pages/WeeklyPlanSelection";
import MonthlyPlanSelection from "./pages/MonthlyPlanSelection";
import Orders from "./pages/Orders";
import Reviews from "./pages/Reviews";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Navigation />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<Auth />} />
              <Route path="/home" element={<Home />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/plans" element={<Plans />} />
              <Route path="/weekly-plan-selection" element={<WeeklyPlanSelection />} />
              <Route path="/monthly-plan-selection" element={<MonthlyPlanSelection />} />
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/payment" element={<PaymentDemo />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <FloatingCartBanner />
            <MobileNavigation />
            <AdminAccess />
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
