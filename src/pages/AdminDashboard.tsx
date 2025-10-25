import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import CouponManagement from '@/components/CouponManagement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import OrderStatusManager from '@/components/OrderStatusManager';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  BarChart3, 
  Users, 
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
  Percent
} from 'lucide-react';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type Item = Database['public']['Tables']['items']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];
type User = Database['public']['Tables']['profiles']['Row'];
type Plan = Database['public']['Tables']['plans']['Row'];
type Review = Database['public']['Tables']['reviews']['Row'];
type Coupon = Database['public']['Tables']['coupon_codes']['Row'];
type Subscription = Database['public']['Tables']['subscriptions']['Row'];

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
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
    totalItems: 0
  });

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

  // Item form
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'breakfast' as Database['public']['Enums']['food_category'],
    is_veg: true,
    is_available: true,
    images: [] as string[]
  });

  // Plan form
  const [planForm, setPlanForm] = useState({
    name: '',
    description: '',
    price: '',
    frequency: 'daily' as Database['public']['Enums']['plan_frequency'],
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
    status: 'active' as Database['public']['Enums']['subscription_status'],
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
      // Load items
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;
      setItems(itemsData || []);

      // Load ALL orders with items and user details for accurate stats
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            items (*)
          ),
          profiles!orders_user_id_fkey (*)
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Load ALL users for accurate count
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Load plans
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (plansError) throw plansError;
      setPlans(plansData || []);

      // Load reviews - fetch separately and join manually since foreign keys don't exist
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (reviewsError) throw reviewsError;

      // Fetch profiles and items to join with reviews
      const { data: reviewProfilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name');
      
      const { data: reviewItemsData } = await supabase
        .from('items')
        .select('id, name');

      // Create lookup maps
      const profilesMap = new Map(reviewProfilesData?.map(p => [p.user_id, p.full_name]) || []);
      const itemsMap = new Map(reviewItemsData?.map(i => [i.id, i.name]) || []);

      // Join the data manually
      const enrichedReviews = (reviewsData || []).map(review => ({
        ...review,
        user_name: profilesMap.get(review.user_id) || 'Unknown User',
        item_name: itemsMap.get(review.item_id) || 'Unknown Item'
      }));

      setReviews(enrichedReviews);

      // Load coupons
      const { data: couponsData, error: couponsError } = await supabase
        .from('coupon_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (couponsError) throw couponsError;
      setCoupons(couponsData || []);

      // Load subscriptions with user and plan details
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          profiles!subscriptions_user_id_fkey (*),
          plans (*)
        `)
        .order('created_at', { ascending: false });

      if (subscriptionsError) throw subscriptionsError;
      setSubscriptions(subscriptionsData || []);

      // Calculate stats from all data
      const totalRevenue = (ordersData || []).reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
      setStats({
        totalOrders: (ordersData || []).length,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalUsers: (usersData || []).length,
        totalItems: (itemsData || []).length
      });

    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
      
      // Handle JWT expired error
      if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
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
      const itemData = {
        name: itemForm.name,
        description: itemForm.description,
        price: parseFloat(itemForm.price),
        category: itemForm.category,
        is_veg: itemForm.is_veg,
        is_available: itemForm.is_available,
        images: itemForm.images
      };

      if (editingItem) {
        const { error } = await supabase
          .from('items')
          .update(itemData)
          .eq('id', editingItem.id);
        if (error) {
          toast.error('Failed to update item: ' + error.message);
          console.error('Supabase update error:', error);
          return;
        }
        toast.success('Item updated successfully');
      } else {
        const { error } = await supabase
          .from('items')
          .insert([itemData]);
        if (error) {
          toast.error('Failed to create item: ' + error.message);
          console.error('Supabase insert error:', error);
          return;
        }
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
      const planData = {
        name: planForm.name,
        description: planForm.description,
        price: parseFloat(planForm.price),
        frequency: planForm.frequency,
        is_active: planForm.is_active
      };

      if (editingPlan) {
        const { error } = await supabase
          .from('plans')
          .update(planData)
          .eq('id', editingPlan.id);
        
        if (error) throw error;
        toast.success('Plan updated successfully');
      } else {
        const { error } = await supabase
          .from('plans')
          .insert([planData]);
        
        if (error) throw error;
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
      // First, delete related order_items
      const { error: orderItemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('item_id', itemId);

      if (orderItemsError) throw orderItemsError;

      // Then delete the item
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
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
      // First, delete related order_items
      const { error: orderItemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (orderItemsError) throw orderItemsError;

      // Then delete the order
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
      
      if (error) throw error;
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

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: userForm.full_name,
          email: userForm.email,
          phone: userForm.phone,
          address: userForm.address,
          is_active: userForm.is_active
        })
        .eq('id', editingUser.id);
      
      if (error) throw error;
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
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId);
      
      if (error) throw error;
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
        const { error } = await supabase
          .from('coupon_codes')
          .update(couponData)
          .eq('id', editingCoupon.id);
        if (error) throw error;
        toast.success('Coupon updated successfully');
      } else {
        const { error } = await supabase
          .from('coupon_codes')
          .insert([couponData]);
        if (error) throw error;
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
      const { error } = await supabase
        .from('coupon_codes')
        .delete()
        .eq('id', couponId);
      
      if (error) throw error;
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
        const { error } = await supabase
          .from('subscriptions')
          .update(subscriptionData)
          .eq('id', editingSubscription.id);
        if (error) throw error;
        toast.success('Subscription updated');
      } else {
        const { error } = await supabase
          .from('subscriptions')
          .insert([subscriptionData]);
        if (error) throw error;
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
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('id', subscriptionId);
      
      if (error) throw error;
      toast.success('Subscription deleted');
      setSubscriptionToDelete(null);
      loadDashboardData();
    } catch (error: any) {
      toast.error('Failed to delete subscription');
      console.error('Error deleting subscription:', error);
    }
  };

  const resetItemForm = () => {
    setItemForm({
      name: '',
      description: '',
      price: '',
      category: 'breakfast' as Database['public']['Enums']['food_category'],
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-bg mobile-nav-spacing">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div>
            <Button variant="outline" onClick={async () => {
              const { error } = await signOut();
              if (error) {
                toast.error('Failed to sign out');
              } else {
                toast.success('Signed out');
                window.location.href = '/auth';
              }
            }}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
                <Users className="h-5 w-5 text-blue-600" />
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
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="coupons">Coupons</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recent Orders */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Recent Orders</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-semibold">Order #{order.id.slice(-8)}</p>
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
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold">Order #{order.id.slice(-8)}</span>
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
                            variant="outline" 
                            size="sm" 
                            onClick={() => setOrderToDelete(order.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {/* Customer Details */}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Customer:</span>
                          <span className="font-medium">{order.profiles?.full_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span>{order.profiles?.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-medium">₹{order.total_amount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ordered:</span>
                          <span>{new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-muted-foreground">
                          <strong>Address:</strong> {order.delivery_address}
                        </div>
                        
                        {/* Order Items */}
                        <div className="border-t pt-2 mt-2">
                          <span className="text-muted-foreground font-medium">Items:</span>
                          <div className="mt-1 space-y-1">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="flex justify-between text-sm">
                                <span>{item.items.name} x{item.quantity}</span>
                                <span>₹{item.price * item.quantity}</span>
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
          </TabsContent>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-4">
            <Card>
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
                      <div className="space-y-4">
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
                            onValueChange={(value) => setItemForm(prev => ({ ...prev, category: value as Database['public']['Enums']['food_category'] }))}
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
                          <Label htmlFor="images">Image URLs</Label>
                          <div className="space-y-2">
                            {itemForm.images.map((img, idx) => (
                              <div key={idx} className="flex space-x-2">
                                <Input
                                  value={img}
                                  onChange={(e) => {
                                    const newImages = [...itemForm.images];
                                    newImages[idx] = e.target.value;
                                    setItemForm(prev => ({ ...prev, images: newImages }));
                                  }}
                                  placeholder="Enter image URL"
                                />
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    const newImages = itemForm.images.filter((_, i) => i !== idx);
                                    setItemForm(prev => ({ ...prev, images: newImages }));
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setItemForm(prev => ({ ...prev, images: [...prev.images, ''] }))}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add Image
                            </Button>
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
                          <Button onClick={handleSaveItem} className="flex-1">
                            <Save className="h-4 w-4 mr-2" />
                            {editingItem ? 'Update' : 'Create'}
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
          </TabsContent>

          {/* Plans Tab */}
          <TabsContent value="plans" className="space-y-4">
            <Card>
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
                          <Select value={planForm.frequency} onValueChange={(value) => setPlanForm(prev => ({ ...prev, frequency: value as Database['public']['Enums']['plan_frequency'] }))}>
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
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
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
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="space-y-4">
            <Card>
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
                          <Select value={subscriptionForm.status} onValueChange={(value) => setSubscriptionForm(prev => ({ ...prev, status: value as Database['public']['Enums']['subscription_status'] }))}>
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
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4">
            <Card>
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
          </TabsContent>
        </Tabs>

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
      </div>
    </div>
  );
}