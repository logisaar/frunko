import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import CouponManagement from '@/components/CouponManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import OrderStatusManager from '@/components/OrderStatusManager';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import {
  BarChart3,
  Users as UsersIcon,
  Package,
  ChefHat,
  DollarSign,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  X,
  MessageSquare,
  Tag,
  Percent,
  Crown,
  Shield,
  LayoutDashboard,
  ShoppingBag,
  Utensils,
  CreditCard,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { Item, Order, User, Plan, Review, Coupon, Subscription } from '@/types';

export default function AdminDashboard() {
  const { user, signIn, signOut, loading: authLoading } = useAuth();
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoggingIn, setAdminLoggingIn] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    totalItems: 0,
    activeSubscriptions: 0,
    totalSubscriptionRevenue: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);

  // Form states
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showCouponDialog, setShowCouponDialog] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Item form
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'breakfast',
    is_veg: true,
    is_available: true,
    images: [] as string[]
  });

  // Plan form
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price: '',
    frequency: 'daily',
    is_active: true
  });

  // User form
  const [userForm, setUserForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    is_active: true
  });

  // Coupon form
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_order_value: '',
    max_discount: '',
    usage_limit: '',
    valid_until: '',
    is_active: true
  });

  // Subscription form
  const [subscriptionForm, setSubscriptionForm] = useState({
    user_id: '',
    plan_id: '',
    status: 'active',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  });

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [
        itemsData,
        ordersData,
        usersData,
        plansData,
        reviewsData,
        couponsData,
        subscriptionsData,
        dashboardStats
      ] = await Promise.all([
        api.getItems(true).catch(() => []),
        api.getAllOrders().catch(() => []),
        api.getAllUsers().catch(() => []),
        api.getPlans(true).catch(() => []),
        api.getReviews().catch(() => []),
        api.getCoupons().catch(() => []),
        api.getSubscriptions().catch(() => []),
        api.getDashboardStats().catch(() => null)
      ]);

      setItems(itemsData || []);

      // Only show successfully paid or manually confirmed orders to the admin.
      // Hide abandoned checkouts (pending payment) or failed/cancelled payment attempts.
      const validOrders = (ordersData || [])
        .filter((order: any) => {
          const isPaid = order.payment_status === 'paid' || order.paymentStatus === 'paid';
          const isManuallyConfirmed = ['preparing', 'out_for_delivery', 'delivered'].includes(order.status);
          return isPaid || isManuallyConfirmed;
        })
        .sort((a: any, b: any) => {
          const dateA = new Date(a.created_at || a.createdAt || 0).getTime();
          const dateB = new Date(b.created_at || b.createdAt || 0).getTime();
          return dateB - dateA;
        });
      setOrders(validOrders);

      setUsers(usersData || []);
      setPlans(plansData || []);

      // Chart Data Generation
      if (validOrders.length > 0) {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split('T')[0];
        }).reverse();

        const groupedData = last7Days.map(dateStr => {
          const dayOrders = validOrders.filter((o: any) => {
            const dateVal = o.createdAt || o.created_at || new Date().toISOString();
            const orderDate = new Date(dateVal).toISOString().split('T')[0];
            return orderDate === dateStr;
          });

          // Only count successfully paid/delivered orders for revenue
          const revenue = dayOrders
            .filter((o: any) => o.status !== 'cancelled' && (o.payment_status === 'paid' || o.paymentStatus === 'paid'))
            .reduce((sum: number, o: any) => sum + Number(o.totalAmount || o.total_amount || 0), 0);

          return {
            name: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
            revenue: Math.round(revenue),
            orders: dayOrders.length
          };
        });
        setChartData(groupedData);
      } else {
        setChartData([]);
      }

      const enrichedReviews = (reviewsData || []).map((review: any) => ({
        ...review,
        user_name: review.user?.fullName || 'Unknown User',
        item_name: review.item?.name || 'Unknown Item'
      }));
      setReviews(enrichedReviews);

      setCoupons(couponsData || []);

      const enrichedSubscriptions = (subscriptionsData || []).map((sub: any) => ({
        ...sub,
        profiles: sub.user || null
      }));
      setSubscriptions(enrichedSubscriptions);

      if (dashboardStats) {
        setStats(dashboardStats);
      } else {
        // Fallback calculation - only count successful orders
        const successfulOrders = validOrders.filter((o: any) => o.status !== 'cancelled' && (o.payment_status === 'paid' || o.paymentStatus === 'paid'));
        const totalRevenue = successfulOrders.reduce((sum: number, order: any) => sum + Number(order.totalAmount || order.total_amount || 0), 0);

        const activeSubscriptionsCount = (subscriptionsData || []).filter((sub: any) => sub.status === 'active').length;
        const subscriptionRevenue = (subscriptionsData || [])
          .filter((sub: any) => sub.status === 'active')
          .reduce((sum: number, sub: any) => sum + Number(sub.plan?.price || sub.plans?.price || 0), 0);

        setStats({
          totalOrders: validOrders.length, // show all orders count
          totalRevenue: Math.round(totalRevenue * 100) / 100, // but only successful revenue
          totalUsers: (usersData || []).length,
          totalItems: (itemsData || []).length,
          activeSubscriptions: activeSubscriptionsCount,
          totalSubscriptionRevenue: Math.round(subscriptionRevenue * 100) / 100
        });
      }

    } catch (error: any) {
      console.error('Error loading dashboard data:', error);

      // Handle JWT expired error
      if (error.status === 401 || error.message?.includes('JWT')) {
        toast.error('Session expired. Please sign in again.');
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
      } else {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async () => {
    try {
      // Validate category
      const validCategories = [
        "Nutri-shakes",
        "lunch",
        "dinner",
        "snacks",
        "beverages",
        "desserts",
        "frunko_bowls"
      ];
      console.log('DEBUG: itemForm.category =', itemForm.category);
      if (!itemForm.category || !validCategories.includes(itemForm.category)) {
        toast.error(`Invalid or missing category: ${itemForm.category}`);
        return;
      }
      const itemDataParams = {
        name: itemForm.name,
        description: itemForm.description,
        price: parseFloat(itemForm.price),
        category: itemForm.category,
        isVeg: itemForm.is_veg,
        isAvailable: itemForm.is_available,
        images: itemForm.images
      };

      if (editingItem) {
        await api.updateItem(editingItem.id, itemDataParams);
        toast.success('Item updated successfully');
      } else {
        await api.createItem(itemDataParams);
        toast.success('Item created successfully');
      }

      setShowItemDialog(false);
      setEditingItem(null);
      resetItemForm();
      loadDashboardData();
    } catch (error: any) {
      toast.error('Failed to save item (exception)');
      console.error('Error saving item:', error);
    }
  };

  const handleSavePlan = async () => {
    try {
      const planDataParams = {
        name: planForm.name,
        description: planForm.description,
        price: parseFloat(planForm.price),
        frequency: planForm.frequency,
        isActive: planForm.is_active
      };

      if (editingPlan) {
        await api.updatePlan(editingPlan.id, planDataParams);
        toast.success('Plan updated successfully');
      } else {
        await api.createPlan(planDataParams);
        toast.success('Plan created successfully');
      }

      setShowPlanDialog(false);
      setEditingPlan(null);
      resetPlanForm();
      loadDashboardData();
    } catch (error: any) {
      toast.error('Failed to save plan');
      console.error('Error saving plan:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await api.deleteItem(itemId);
      toast.success('Item deleted successfully');
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      loadDashboardData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete item');
      console.error('Error deleting item:', error);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await api.deleteOrder(orderId);
      toast.success('Order deleted successfully');
      setOrderToDelete(null);
      loadDashboardData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete order');
      console.error('Error deleting order:', error);
    }
  };

  const handleSaveUser = async () => {
    try {
      if (!editingUser) return;

      toast.info('User update simulated (Requires backend updateUser endpoint)');
      toast.success('User updated successfully');
      setShowUserDialog(false);
      setEditingUser(null);
      resetUserForm();
      loadDashboardData();
    } catch (error: any) {
      toast.error('Failed to update user');
      console.error('Error updating user:', error);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      await api.deletePlan(planId);
      toast.success('Plan deleted successfully');
      loadDashboardData();
    } catch (error: any) {
      toast.error('Failed to delete plan');
      console.error('Error deleting plan:', error);
    }
  };

  // Coupon CRUD operations
  const handleSaveCoupon = async () => {
    try {
      if (!couponForm.code || !couponForm.discount_value) {
        toast.error('Please fill in all required fields');
        return;
      }

      const couponData = {
        code: couponForm.code.toUpperCase(),
        discount_type: couponForm.discount_type,
        discount_value: parseFloat(couponForm.discount_value),
        min_order_value: couponForm.min_order_value ? parseFloat(couponForm.min_order_value) : 0,
        max_discount: couponForm.max_discount ? parseFloat(couponForm.max_discount) : null,
        usage_limit: couponForm.usage_limit ? parseInt(couponForm.usage_limit) : null,
        valid_until: couponForm.valid_until || null,
        is_active: couponForm.is_active,
        created_by: user!.id
      };

      if (editingCoupon) {
        // Simulated update
        toast.info('Coupon update simulated');
        toast.success('Coupon updated successfully');
      } else {
        await api.createCoupon({
          code: couponData.code,
          discountType: couponData.discount_type,
          discountValue: couponData.discount_value,
          minOrderValue: couponData.min_order_value,
          maxDiscount: couponData.max_discount || undefined,
          usageLimit: couponData.usage_limit || undefined,
          validUntil: couponData.valid_until || undefined,
          isActive: couponData.is_active
        });
        toast.success('Coupon created successfully');
      }

      setShowCouponDialog(false);
      setEditingCoupon(null);
      resetCouponForm();
      loadDashboardData();
    } catch (error: any) {
      toast.error(editingCoupon ? 'Failed to update coupon' : 'Failed to create coupon');
      console.error('Error saving coupon:', error);
    }
  };

  const handleDeleteCoupon = async (couponId: string) => {
    try {
      await api.deleteCoupon(couponId);
      toast.success('Coupon deleted successfully');
      setCouponToDelete(null);
      loadDashboardData();
    } catch (error: any) {
      toast.error('Failed to delete coupon');
      console.error('Error deleting coupon:', error);
    }
  };

  const handleSaveSubscription = async () => {
    try {
      if (!subscriptionForm.user_id || !subscriptionForm.plan_id) {
        toast.error('Please select user and plan');
        return;
      }

      const subscriptionData = {
        user_id: subscriptionForm.user_id,
        plan_id: subscriptionForm.plan_id,
        status: subscriptionForm.status,
        start_date: subscriptionForm.start_date,
        end_date: subscriptionForm.end_date || null
      };

      if (editingSubscription) {
        toast.info('Subscription update simulated (Backend not implemented)');
        toast.success('Subscription updated');
      } else {
        toast.info('Subscription creation simulated (Backend not implemented)');
        toast.success('Subscription created');
      }

      setShowSubscriptionDialog(false);
      setEditingSubscription(null);
      resetSubscriptionForm();
      loadDashboardData();
    } catch (error: any) {
      toast.error('Failed to save subscription');
      console.error('Error saving subscription:', error);
    }
  };

  const handleDeleteSubscription = async (subscriptionId: string) => {
    try {
      await api.deleteSubscription(subscriptionId);
      toast.success('Subscription deleted');
      setSubscriptionToDelete(null);
      loadDashboardData();
    } catch (error: any) {
      toast.error('Failed to delete subscription');
      console.error('Error deleting subscription:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Simulated delete user profile
      toast.info('User deletion simulated (Requires backend deleteUser endpoint)');
      toast.success('User deleted successfully');
      setUserToDelete(null);
      loadDashboardData();
    } catch (error: any) {
      toast.error('Failed to delete user');
      console.error('Error deleting user:', error);
    }
  };

  const resetItemForm = () => {
    setItemForm({
      name: '',
      description: '',
      price: '',
      category: 'breakfast',
      is_veg: true,
      is_available: true,
      images: []
    });
  };

  const resetPlanForm = () => {
    setPlanForm({
      name: '',
      description: '',
      price: '',
      frequency: 'daily',
      is_active: true
    });
  };

  const resetUserForm = () => {
    setUserForm({
      full_name: '',
      email: '',
      phone: '',
      address: '',
      is_active: true
    });
  };

  const resetCouponForm = () => {
    setCouponForm({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_order_value: '',
      max_discount: '',
      usage_limit: '',
      valid_until: '',
      is_active: true
    });
  };

  const resetSubscriptionForm = () => {
    setSubscriptionForm({
      user_id: '',
      plan_id: '',
      status: 'active',
      start_date: new Date().toISOString().split('T')[0],
      end_date: ''
    });
  };

  const openEditItem = (item: Item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category,
      is_veg: item.is_veg,
      is_available: item.is_available,
      images: item.images || []
    });
    setShowItemDialog(true);
  };

  const openEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      description: plan.description || '',
      price: plan.price.toString(),
      frequency: plan.frequency,
      is_active: plan.is_active
    });
    setShowPlanDialog(true);
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
      is_active: user.is_active
    });
    setShowUserDialog(true);
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'out_for_delivery': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'preparing': return <ChefHat className="h-4 w-4" />;
      case 'out_for_delivery': return <Package className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (authLoading || (user && loading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-warm-bg space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      toast.error('Please enter email and password');
      return;
    }
    setAdminLoggingIn(true);
    const { error } = await signIn(adminEmail, adminPassword);
    setAdminLoggingIn(false);

    if (error) {
      toast.error(error.message);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-bg p-4 mobile-nav-spacing">
        <Card className="w-full max-w-md shadow-lg border-primary/20">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Admin Access</CardTitle>
            <CardDescription>
              {user ? "You do not have permission to view this page. Please sign in with an admin account." : "Enter your credentials to access the admin portal"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdminAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter admin email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  disabled={adminLoggingIn}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  disabled={adminLoggingIn}
                  required
                />
              </div>
              {user && user.role !== 'admin' && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
                  Currently signed in as <strong>{user.email}</strong>, which is not an admin. Sign in with an admin account to proceed.
                </div>
              )}
              <Button type="submit" className="w-full" disabled={adminLoggingIn}>
                {adminLoggingIn ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Authenticating...
                  </>
                ) : (
                  'Access Dashboard'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-5 w-5 mr-3" /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingBag className="h-5 w-5 mr-3" /> },
    { id: 'items', label: 'Menu Items', icon: <Utensils className="h-5 w-5 mr-3" /> },
    { id: 'plans', label: 'Plans', icon: <CreditCard className="h-5 w-5 mr-3" /> },
    { id: 'users', label: 'Users', icon: <UsersIcon className="h-5 w-5 mr-3" /> },
    { id: 'subscriptions', label: 'Subscriptions', icon: <Crown className="h-5 w-5 mr-3" /> },
    { id: 'reviews', label: 'Reviews', icon: <Star className="h-5 w-5 mr-3" /> },
    { id: 'coupons', label: 'Coupons', icon: <Tag className="h-5 w-5 mr-3" /> },
  ];

  return (
    <div className="min-h-screen bg-warm-bg flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white/80 backdrop-blur-md border-r border-primary/10 shadow-lg hidden md:flex flex-col shrink-0 fixed h-screen z-10">
        <div className="p-6 border-b border-primary/10 flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Admin</h2>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === item.id
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 font-medium'
                : 'text-muted-foreground hover:bg-primary/5 hover:text-foreground'
                }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-primary/10 mt-auto">
          <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => signOut()}>
            <XCircle className="h-5 w-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full md:ml-64 p-4 md:p-8 overflow-y-auto min-h-screen">
        <div className="md:hidden flex items-center justify-between mb-6 pb-4 border-b">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Admin</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {sidebarItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
          </h1>
        </div>


        {activeTab === "overview" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Orders</p>
                      <p className="text-2xl font-bold">{stats.totalOrders}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">₹{stats.totalRevenue}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <UsersIcon className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold">{stats.totalUsers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <ChefHat className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Menu Items</p>
                      <p className="text-2xl font-bold">{stats.totalItems}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Active Subs</p>
                      <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-muted-foreground">Sub Revenue</p>
                      <p className="text-2xl font-bold">₹{stats.totalSubscriptionRevenue}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Overview Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {/* Revenue Chart */}
              <Card className="col-span-1 lg:col-span-2 shadow-sm border-primary/10 bg-white/50 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <span>Revenue Trend (Last 7 Days)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Orders Chart */}
              <Card className="shadow-sm border-primary/10 bg-white/50 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <span>Order Volume</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="orders" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Recent Orders Overview */}
              <Card className="shadow-sm border-primary/10 bg-white/50 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-gray-700" />
                    <span>Recent Orders</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border border-primary/5 rounded-lg bg-background/50 hover:bg-background transition-colors">
                        <div>
                          <p className="font-semibold text-gray-800">Order #{order.id.slice(-8)}</p>
                          <p className="text-sm text-muted-foreground">₹{order.total_amount}</p>
                        </div>
                        <Badge className={getOrderStatusColor(order.status)}>
                          <div className="flex items-center space-x-1">
                            {getOrderStatusIcon(order.status)}
                            <span className="capitalize">{order.status.replace('_', ' ')}</span>
                          </div>
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Top Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ChefHat className="h-5 w-5" />
                    <span>Menu Items</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {items.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm text-muted-foreground">₹{item.price}</p>
                        </div>
                        <Badge variant={item.is_available ? 'default' : 'secondary'}>
                          {item.is_available ? 'Available' : 'Unavailable'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subscription Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Crown className="h-5 w-5 text-primary" />
                    <span>Active Subscriptions</span>
                  </CardTitle>
                  <CardDescription>Users with active subscription plans</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {subscriptions.filter(sub => sub.status === 'active').slice(0, 5).map((sub: any) => (
                      <div key={sub.id} className="flex items-center justify-between p-3 border rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5">
                        <div>
                          <p className="font-semibold">{sub.profiles?.full_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{sub.plans?.name} - ₹{sub.plans?.price}/{sub.plans?.frequency}</p>
                        </div>
                        <Badge className="bg-green-500">Active</Badge>
                      </div>
                    ))}
                    {subscriptions.filter(sub => sub.status === 'active').length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">No active subscriptions</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span>Subscription Stats</span>
                  </CardTitle>
                  <CardDescription>Summary of subscription metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Total Subscriptions</span>
                      <span className="text-xl font-bold">{subscriptions.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                      <span className="text-sm font-medium">Active</span>
                      <span className="text-xl font-bold text-green-600">{subscriptions.filter(sub => sub.status === 'active').length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                      <span className="text-sm font-medium">Paused</span>
                      <span className="text-xl font-bold text-yellow-600">{subscriptions.filter(sub => sub.status === 'paused').length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                      <span className="text-sm font-medium">Cancelled</span>
                      <span className="text-xl font-bold text-red-600">{subscriptions.filter(sub => sub.status === 'cancelled').length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/10">
                      <span className="text-sm font-medium">Monthly Revenue</span>
                      <span className="text-xl font-bold text-primary">₹{stats.totalSubscriptionRevenue}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>)}

        {/* Orders Tab */}
        {activeTab === "orders" && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card>
            <CardHeader>
              <CardTitle>All Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-primary/10 rounded-xl p-5 md:p-6 bg-white/50 backdrop-blur-md shadow-sm hover:shadow-lg transition-all">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-primary/10 pb-4">
                      <div className="flex items-center space-x-4">
                        <div className="bg-primary/10 p-3 rounded-2xl">
                          <ShoppingBag className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-xl text-foreground tracking-tight">#{order.id.slice(-8).toUpperCase()}</span>
                            <Badge className={`${getOrderStatusColor(order.status)} px-3 py-1 shadow-sm`}>
                              <div className="flex items-center space-x-1.5">
                                {getOrderStatusIcon(order.status)}
                                <span className="capitalize font-semibold">{order.status.replace('_', ' ')}</span>
                              </div>
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center mt-1.5 font-medium">
                            <Clock className="w-4 h-4 mr-1.5 text-primary/60" />
                            {new Date(order.created_at || order.createdAt).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 md:space-x-5 bg-white/60 p-2.5 rounded-2xl border shadow-sm backdrop-blur-sm">
                        <div className="flex flex-col items-end px-3">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Total</span>
                          <span className="font-black text-xl text-primary font-mono">₹{order.total_amount}</span>
                        </div>
                        <div className="h-10 w-px bg-border/60 hidden md:block"></div>
                        <div className="flex flex-col items-end px-2">
                          <Badge className={`text-xs px-2 py-0.5 ${(order.payment_status || order.paymentStatus) === 'paid'
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : (order.payment_status || order.paymentStatus) === 'failed'
                              ? 'bg-red-100 text-red-700 border-red-200'
                              : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                            }`}>
                            {(order.payment_status || order.paymentStatus) === 'paid' ? '✅ Paid' : (order.payment_status || order.paymentStatus) === 'failed' ? '❌ Failed' : '⏳ Pending'}
                          </Badge>
                          {(order.paytm_txn_id || order.paytmTxnId) && (
                            <span className="text-[10px] text-muted-foreground font-mono mt-0.5">TXN: {(order.paytm_txn_id || order.paytmTxnId)}</span>
                          )}
                        </div>
                        <div className="h-10 w-px bg-border/60 hidden md:block"></div>
                        <div className="flex items-center space-x-2">
                          <OrderStatusManager
                            orderId={order.id}
                            currentStatus={order.status}
                            onStatusUpdate={(newStatus) => {
                              setOrders(prev => prev.map(o =>
                                o.id === order.id ? { ...o, status: newStatus } : o
                              ));
                            }}
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-10 w-10 text-white shadow-md hover:shadow-lg rounded-xl transition-all"
                            onClick={() => setOrderToDelete(order.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      {/* Customer Details Card */}
                      <div className="flex flex-col space-y-4 bg-gradient-to-br from-muted/30 to-background/50 p-5 rounded-2xl border border-primary/5 shadow-inner">
                        <h4 className="font-bold text-foreground flex items-center border-b border-primary/10 pb-2.5">
                          <UsersIcon className="w-4 h-4 mr-2 text-primary" /> Delivery Info
                        </h4>
                        <div className="space-y-3 flex-1">
                          <div className="flex items-start justify-between">
                            <span className="text-muted-foreground font-medium">Customer:</span>
                            <div className="text-right flex flex-col items-end">
                              <span className="font-bold text-foreground">{order.profiles?.full_name}</span>
                              <span className="text-xs text-muted-foreground font-mono">{order.profiles?.email}</span>
                            </div>
                          </div>
                          <div className="flex items-start justify-between pt-2 border-t border-border/30">
                            <span className="text-muted-foreground font-medium mr-4">Address:</span>
                            <span className="text-right leading-snug tracking-tight text-foreground/90 max-w-[200px]">{order.delivery_address}</span>
                          </div>
                        </div>
                      </div>

                      {/* Order Items Card */}
                      <div className="flex flex-col space-y-4 bg-gradient-to-br from-primary/5 to-background/50 p-5 rounded-2xl border border-primary/10 shadow-inner">
                        <h4 className="font-bold text-foreground flex items-center border-b border-primary/10 pb-2.5">
                          <Utensils className="w-4 h-4 mr-2 text-primary" /> Order Contents <Badge variant="secondary" className="ml-2 py-0 h-5 px-1.5">{order.order_items?.length || 0}</Badge>
                        </h4>
                        <div className="space-y-2 flex-1 max-h-[140px] overflow-y-auto pr-1">
                          {order.order_items?.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center bg-white/70 backdrop-blur-sm rounded-xl p-2.5 border border-primary/5 shadow-sm">
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-foreground">{item.items?.name || 'Item'}</span>
                                <Badge variant="outline" className="px-1.5 py-0 border-primary/20 text-xs bg-primary/5 text-primary">x{item.quantity}</Badge>
                              </div>
                              <span className="font-black text-foreground font-mono">₹{item.price * item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>)}

        {/* Items Tab */}
        {activeTab === "items" && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-6">
          <Card className="bg-white/50 backdrop-blur-md shadow-sm border-primary/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Menu Items</CardTitle>
                <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => { resetItemForm(); setEditingItem(null); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
                      <DialogDescription>
                        {editingItem ? 'Update the item details below.' : 'Fill in the details for the new menu item.'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto px-2 pb-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Item Name</Label>
                        <Input
                          id="name"
                          value={itemForm.name}
                          onChange={(e) => setItemForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter item name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={itemForm.description}
                          onChange={(e) => setItemForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter item description"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (₹)</Label>
                        <Input
                          id="price"
                          type="number"
                          value={itemForm.price}
                          onChange={(e) => setItemForm(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="Enter price"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={itemForm.category || 'breakfast'}
                          onValueChange={(value) => setItemForm(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger id="category">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="breakfast">Breakfast</SelectItem>
                            <SelectItem value="lunch">Lunch</SelectItem>
                            <SelectItem value="dinner">Dinner</SelectItem>
                            <SelectItem value="snacks">Snacks</SelectItem>
                            <SelectItem value="beverages">Beverages</SelectItem>
                            <SelectItem value="desserts">Desserts</SelectItem>
                            <SelectItem value="frunko_bowls">Frunko Bowls</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="images">Item Images</Label>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          {itemForm.images.map((img, idx) => (
                            <div key={idx} className="relative group rounded-md overflow-hidden border">
                              <img src={getImageUrl(img)} alt="Preview" className="w-full h-20 object-cover" />
                              <button
                                onClick={() => {
                                  const newImages = itemForm.images.filter((_, i) => i !== idx);
                                  setItemForm(prev => ({ ...prev, images: newImages }));
                                }}
                                className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white p-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={isUploadingImages}
                            onChange={async (e) => {
                              if (!e.target.files?.length) return;
                              setIsUploadingImages(true);
                              try {
                                const res = await api.uploadItemImages(e.target.files);
                                setItemForm(prev => ({ ...prev, images: [...prev.images, ...res.urls] }));
                                toast.success('Images uploaded!');
                              } catch (err: any) {
                                toast.error(err.message || 'Upload failed');
                              } finally {
                                setIsUploadingImages(false);
                              }
                              e.target.value = ''; // reset input
                            }}
                            className="cursor-pointer"
                          />
                          {isUploadingImages && (
                            <div className="flex items-center space-x-2 text-primary text-sm font-medium">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              <span>Uploading...</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is_veg"
                            checked={itemForm.is_veg}
                            onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, is_veg: checked }))}
                          />
                          <Label htmlFor="is_veg">Vegetarian</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is_available"
                            checked={itemForm.is_available}
                            onCheckedChange={(checked) => setItemForm(prev => ({ ...prev, is_available: checked }))}
                          />
                          <Label htmlFor="is_available">Available</Label>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={handleSaveItem}
                          className={`flex-1 transition-all ${isUploadingImages ? 'opacity-70 cursor-not-allowed bg-muted text-muted-foreground hover:bg-muted' : ''}`}
                          disabled={isUploadingImages}
                        >
                          {isUploadingImages ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                              <span>Please wait...</span>
                            </div>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              {editingItem ? 'Update' : 'Create'}
                            </>
                          )}
                        </Button>
                        <Button variant="outline" onClick={() => setShowItemDialog(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{item.name}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant={item.is_available ? 'default' : 'secondary'}>
                          {item.is_available ? 'Available' : 'Unavailable'}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => openEditItem(item)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setItemToDelete(item.id);
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Price: ₹{item.price}</div>
                      <div>Category: {item.category}</div>
                      <div>Type: {item.is_veg ? 'Vegetarian' : 'Non-Vegetarian'}</div>
                      {item.description && <div>Description: {item.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>)}

        {/* Plans Tab */}
        {activeTab === "plans" && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-6">
          <Card className="bg-white/50 backdrop-blur-md shadow-sm border-primary/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Subscription Plans</CardTitle>
                <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => { resetPlanForm(); setEditingPlan(null); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingPlan ? 'Edit Plan' : 'Add New Plan'}</DialogTitle>
                      <DialogDescription>
                        {editingPlan ? 'Update the plan details below.' : 'Fill in the details for the new subscription plan.'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="plan-name">Plan Name</Label>
                        <Input
                          id="plan-name"
                          value={planForm.name}
                          onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter plan name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="plan-description">Description</Label>
                        <Textarea
                          id="plan-description"
                          value={planForm.description}
                          onChange={(e) => setPlanForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Enter plan description"
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="plan-price">Price (₹)</Label>
                        <Input
                          id="plan-price"
                          type="number"
                          value={planForm.price}
                          onChange={(e) => setPlanForm(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="Enter price"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="frequency">Frequency</Label>
                        <Select value={planForm.frequency} onValueChange={(value) => setPlanForm(prev => ({ ...prev, frequency: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="is_active"
                          checked={planForm.is_active}
                          onCheckedChange={(checked) => setPlanForm(prev => ({ ...prev, is_active: checked }))}
                        />
                        <Label htmlFor="is_active">Active</Label>
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={handleSavePlan} className="flex-1">
                          <Save className="h-4 w-4 mr-2" />
                          {editingPlan ? 'Update' : 'Create'}
                        </Button>
                        <Button variant="outline" onClick={() => setShowPlanDialog(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {plans.map((plan) => (
                  <div key={plan.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{plan.name}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => openEditPlan(plan)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeletePlan(plan.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Price: ₹{plan.price}/{plan.frequency}</div>
                      <div>Frequency: {plan.frequency}</div>
                      {plan.description && <div>Description: {plan.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>)}

        {/* Users Tab */}
        {activeTab === "users" && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-6">
          <Card className="bg-white/50 backdrop-blur-md shadow-sm border-primary/10">
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{user.full_name}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge variant={user.is_active ? 'default' : 'secondary'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => openEditUser(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setUserToDelete(user.user_id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Email: {user.email}</div>
                      <div>Phone: {user.phone || 'Not provided'}</div>
                      <div>Address: {user.address || 'Not provided'}</div>
                      <div>Role: {user.role}</div>
                      <div>Joined: {new Date(user.created_at).toLocaleDateString()}</div>
                      {user.last_login && <div>Last Login: {new Date(user.last_login).toLocaleString()}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>)}

        {/* Subscriptions Tab */}
        {activeTab === "subscriptions" && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-6">
          <Card className="bg-white/50 backdrop-blur-md shadow-sm border-primary/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>User Subscriptions</CardTitle>
                <Dialog open={showSubscriptionDialog} onOpenChange={setShowSubscriptionDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => { resetSubscriptionForm(); setEditingSubscription(null); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Subscription
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingSubscription ? 'Edit Subscription' : 'Add New Subscription'}</DialogTitle>
                      <DialogDescription>
                        {editingSubscription ? 'Update subscription details.' : 'Create a new subscription for a user.'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>User</Label>
                        <Select value={subscriptionForm.user_id} onValueChange={(value) => setSubscriptionForm(prev => ({ ...prev, user_id: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((u) => (
                              <SelectItem key={u.user_id} value={u.user_id}>{u.full_name} ({u.email})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Plan</Label>
                        <Select value={subscriptionForm.plan_id} onValueChange={(value) => setSubscriptionForm(prev => ({ ...prev, plan_id: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select plan" />
                          </SelectTrigger>
                          <SelectContent>
                            {plans.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name} - ₹{p.price}/{p.frequency}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={subscriptionForm.status} onValueChange={(value) => setSubscriptionForm(prev => ({ ...prev, status: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="date" value={subscriptionForm.start_date} onChange={(e) => setSubscriptionForm(prev => ({ ...prev, start_date: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date (Optional)</Label>
                        <Input type="date" value={subscriptionForm.end_date} onChange={(e) => setSubscriptionForm(prev => ({ ...prev, end_date: e.target.value }))} />
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={handleSaveSubscription} className="flex-1">
                          <Save className="h-4 w-4 mr-2" />
                          {editingSubscription ? 'Update' : 'Create'}
                        </Button>
                        <Button variant="outline" onClick={() => setShowSubscriptionDialog(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {subscriptions.map((sub: any) => (
                  <div key={sub.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{sub.profiles?.full_name || 'Unknown User'}</h3>
                        <p className="text-sm text-muted-foreground">{sub.plans?.name || 'Unknown Plan'}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                          {sub.status}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => {
                          setEditingSubscription(sub);
                          setSubscriptionForm({
                            user_id: sub.user_id,
                            plan_id: sub.plan_id,
                            status: sub.status,
                            start_date: sub.start_date?.split('T')[0] || '',
                            end_date: sub.end_date?.split('T')[0] || ''
                          });
                          setShowSubscriptionDialog(true);
                        }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setSubscriptionToDelete(sub.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Price: ₹{sub.plans?.price}/{sub.plans?.frequency}</div>
                      <div>Start: {new Date(sub.start_date).toLocaleDateString()}</div>
                      {sub.end_date && <div>End: {new Date(sub.end_date).toLocaleDateString()}</div>}
                      <div>Email: {sub.profiles?.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>)}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-6">
          <Card className="bg-white/50 backdrop-blur-md shadow-sm border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>User Reviews</span>
              </CardTitle>
              <CardDescription>Latest feedback from customers across items</CardDescription>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No reviews yet</div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review: any) => (
                    <div key={review.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col">
                          <div className="font-semibold">{review.user_name || 'Unknown User'}</div>
                          <div className="text-sm text-muted-foreground">Item: {review.item_name || 'Unknown Item'}</div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                          ))}
                        </div>
                      </div>
                      {review.comment && <div className="text-sm mt-2">{review.comment}</div>}
                      <div className="text-xs text-muted-foreground mt-2">{new Date(review.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>)}

        {/* Coupons Tab */}
        {activeTab === "coupons" && (<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 mb-6">
          <Card className="bg-white/50 backdrop-blur-md shadow-sm border-primary/10">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <span>Coupon Codes</span>
                  </CardTitle>
                  <CardDescription>Manage discount codes and promotions</CardDescription>
                </div>
                <Dialog open={showCouponDialog} onOpenChange={setShowCouponDialog}>
                  <Button onClick={() => {
                    setEditingCoupon(null);
                    resetCouponForm();
                    setShowCouponDialog(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Coupon
                  </Button>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}</DialogTitle>
                      <DialogDescription>
                        {editingCoupon ? 'Update coupon code details.' : 'Add a new discount coupon code.'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Coupon Code</Label>
                        <Input
                          value={couponForm.code}
                          onChange={(e) => setCouponForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                          placeholder="e.g., SAVE20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Discount Type</Label>
                        <Select value={couponForm.discount_type} onValueChange={(value: 'percentage' | 'fixed') => setCouponForm(prev => ({ ...prev, discount_type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                            <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Discount Value</Label>
                        <Input
                          type="number"
                          value={couponForm.discount_value}
                          onChange={(e) => setCouponForm(prev => ({ ...prev, discount_value: e.target.value }))}
                          placeholder={couponForm.discount_type === 'percentage' ? '20' : '100'}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Minimum Order Value (Optional)</Label>
                        <Input
                          type="number"
                          value={couponForm.min_order_value}
                          onChange={(e) => setCouponForm(prev => ({ ...prev, min_order_value: e.target.value }))}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Discount Amount (Optional)</Label>
                        <Input
                          type="number"
                          value={couponForm.max_discount}
                          onChange={(e) => setCouponForm(prev => ({ ...prev, max_discount: e.target.value }))}
                          placeholder="No limit"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Usage Limit (Optional)</Label>
                        <Input
                          type="number"
                          value={couponForm.usage_limit}
                          onChange={(e) => setCouponForm(prev => ({ ...prev, usage_limit: e.target.value }))}
                          placeholder="Unlimited"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Valid Until (Optional)</Label>
                        <Input
                          type="datetime-local"
                          value={couponForm.valid_until}
                          onChange={(e) => setCouponForm(prev => ({ ...prev, valid_until: e.target.value }))}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="is-active"
                          checked={couponForm.is_active}
                          onChange={(e) => setCouponForm(prev => ({ ...prev, is_active: e.target.checked }))}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="is-active">Active</Label>
                      </div>
                      <div className="flex space-x-2">
                        <Button onClick={handleSaveCoupon} className="flex-1">
                          <Save className="h-4 w-4 mr-2" />
                          {editingCoupon ? 'Update' : 'Create'}
                        </Button>
                        <Button variant="outline" onClick={() => setShowCouponDialog(false)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {coupons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No coupons created yet</div>
              ) : (
                <div className="space-y-3">
                  {coupons.map((coupon) => (
                    <div key={coupon.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{coupon.code}</h3>
                          <p className="text-sm text-muted-foreground">
                            {coupon.discount_type === 'percentage'
                              ? `${coupon.discount_value}% off`
                              : `₹${coupon.discount_value} off`}
                            {coupon.min_order_value > 0 && ` on orders above ₹${coupon.min_order_value}`}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                            {coupon.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => {
                            setEditingCoupon(coupon);
                            setCouponForm({
                              code: coupon.code,
                              discount_type: coupon.discount_type as 'percentage' | 'fixed',
                              discount_value: coupon.discount_value.toString(),
                              min_order_value: coupon.min_order_value?.toString() || '',
                              max_discount: coupon.max_discount?.toString() || '',
                              usage_limit: coupon.usage_limit?.toString() || '',
                              valid_until: coupon.valid_until || '',
                              is_active: coupon.is_active
                            });
                            setShowCouponDialog(true);
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setCouponToDelete(coupon.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1 mt-2">
                        {coupon.max_discount && <div>Max discount: ₹{coupon.max_discount}</div>}
                        {coupon.usage_limit && <div>Usage limit: {coupon.usage_limit} (Used: {coupon.used_count})</div>}
                        {coupon.valid_until && <div>Valid until: {new Date(coupon.valid_until).toLocaleString()}</div>}
                        <div>Created: {new Date(coupon.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>)}


        {/* Delete Item Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Item</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this item? This will also remove it from all orders. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => itemToDelete && handleDeleteItem(itemToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Order Confirmation Dialog */}
        <AlertDialog open={!!orderToDelete} onOpenChange={() => setOrderToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Order</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this order? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => orderToDelete && handleDeleteOrder(orderToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Subscription Confirmation Dialog */}
        <AlertDialog open={!!subscriptionToDelete} onOpenChange={() => setSubscriptionToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this subscription? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => subscriptionToDelete && handleDeleteSubscription(subscriptionToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete User Confirmation Dialog */}
        <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this user? This will also delete all their orders, subscriptions, and reviews. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => userToDelete && handleDeleteUser(userToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Coupon Confirmation Dialog */}
        <AlertDialog open={!!couponToDelete} onOpenChange={() => setCouponToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Coupon</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this coupon code? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => couponToDelete && handleDeleteCoupon(couponToDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Edit User Dialog */}
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user details below.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Full Name</Label>
                <Input
                  id="user-name"
                  value={userForm.full_name}
                  onChange={(e) => setUserForm(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-phone">Phone</Label>
                <Input
                  id="user-phone"
                  value={userForm.phone}
                  onChange={(e) => setUserForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-address">Address</Label>
                <Textarea
                  id="user-address"
                  value={userForm.address}
                  onChange={(e) => setUserForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter address"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="user-active"
                  checked={userForm.is_active}
                  onCheckedChange={(checked) => setUserForm(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="user-active">Active</Label>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleSaveUser} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Update
                </Button>
                <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}