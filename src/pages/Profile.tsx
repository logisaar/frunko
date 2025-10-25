import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Star,
  MessageSquare,
  Package,
  Edit,
  Save,
  X,
  ChefHat,
  Truck,
  LocateFixed,
  Plus,
  Calendar,
  Crown,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/hooks/useCart';
import { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];
type Review = Database['public']['Tables']['reviews']['Row'];
type FoodItem = Database['public']['Tables']['items']['Row'];

export default function Profile() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [geoLoading, setGeoLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [ordersDialogOpen, setOrdersDialogOpen] = useState(false);
  const [giftDialogOpen, setGiftDialogOpen] = useState(false);
  const [addressesDialogOpen, setAddressesDialogOpen] = useState(false);
  const [subscriptionsDialogOpen, setSubscriptionsDialogOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    item_id: '',
    rating: 5,
    comment: ''
  });

  useEffect(() => {
    if (user) {
      loadUserData();
      loadItems();
    }
  }, [user]);

  const { applyCoupon, removeCoupon, coupon } = useCart();

  // Set initial theme from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    } catch {}
  }, []);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (profileData) {
        setProfile(profileData);
        setProfileForm({
          full_name: profileData.full_name,
          email: profileData.email,
          phone: profileData.phone || '',
          address: profileData.address || ''
        });
      }

      // Load orders with nested order_items and item details
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`*, order_items (*, items (*))`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Load reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (reviewsError) throw reviewsError;
      setReviews(reviewsData || []);

      // Load subscriptions with plan details
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          plans (*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (subscriptionsError) throw subscriptionsError;
      setSubscriptions(subscriptionsData || []);

    } catch (error: any) {
      console.error('Error loading user data:', error);
      
      // Handle JWT expired error
      if (error.code === 'PGRST301' || error.message?.includes('JWT')) {
        toast.error('Session expired. Please sign in again.');
        setTimeout(async () => {
          await supabase.auth.signOut();
          window.location.href = '/auth';
        }, 2000);
      } else {
        toast.error('Failed to load user data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      // If we have fresh coordinates, append them to the address so admins can see precise location
      const addressToSave = coords
        ? `${profileForm.address ? profileForm.address + ' | ' : ''}(${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)})`
        : profileForm.address;

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: profileForm.full_name,
          email: profileForm.email,
          phone: profileForm.phone,
          address: addressToSave,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Profile updated successfully');
      setEditingProfile(false);
      loadUserData();
    } catch (error: any) {
      toast.error('Failed to update profile');
      console.error('Error updating profile:', error);
    }
  };

  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('is_available', true)
        .order('name', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      console.error('Error loading items:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !reviewForm.item_id) {
      toast.error('Please select an item to review');
      return;
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.id,
          item_id: reviewForm.item_id,
          rating: reviewForm.rating,
          comment: reviewForm.comment || null,
          order_id: null
        });

      if (error) throw error;

      toast.success('Review submitted successfully!');
      setReviewDialogOpen(false);
      setReviewForm({ item_id: '', rating: 5, comment: '' });
      loadUserData(); // Refresh reviews list
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    }
  };

  const captureCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoords({ lat: latitude, lng: longitude });
        // Pre-fill address text area with a helpful hint (doesn't overwrite user's typed address)
        if (!profileForm.address) {
          setProfileForm((prev) => ({
            ...prev,
            address: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`
          }));
        }
        toast.success('Location captured');
        setGeoLoading(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        toast.error('Failed to capture location');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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
      case 'out_for_delivery': return <Truck className="h-4 w-4" />;
      case 'delivered': return <Package className="h-4 w-4" />;
      case 'cancelled': return <X className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Profile Card */}
          <div className="bg-card rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 rounded-full bg-muted flex items-center justify-center overflow-hidden mb-4">
                {/* Placeholder avatar if no avatar in profile */}
                <img
                  src={(profile as any)?.avatar_url || '/placeholder.svg'}
                  alt={profile?.full_name || 'User avatar'}
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-xl font-bold">{profile?.full_name || 'Anonymous'}</h2>
              <p className="text-sm text-muted-foreground">{profile?.email || profileForm.email}</p>
              {profile?.phone && <p className="text-sm text-muted-foreground">{profile.phone}</p>}
            </div>
          </div>

          {/* Active Subscription Card */}
          {subscriptions.filter(sub => sub.status === 'active').length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 px-2">Active Subscription</h3>
              {subscriptions.filter(sub => sub.status === 'active').map((sub) => (
                <div key={sub.id} className="bg-gradient-to-br from-primary/10 via-primary/5 to-secondary/10 border-2 border-primary/30 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      <Crown className="h-8 w-8 text-primary mt-1" />
                      <div>
                        <h3 className="font-bold text-xl">{sub.plans?.name || 'Premium Plan'}</h3>
                        <p className="text-sm text-muted-foreground">{sub.plans?.description || 'Subscription plan'}</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500 text-white">Active</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="text-xs text-muted-foreground">Price</span>
                      </div>
                      <div className="font-bold text-lg">₹{sub.plans?.price}</div>
                      <div className="text-xs text-muted-foreground capitalize">per {sub.plans?.frequency}</div>
                    </div>
                    <div className="bg-white/50 dark:bg-black/20 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-xs text-muted-foreground">Started</span>
                      </div>
                      <div className="font-bold text-sm">{new Date(sub.start_date).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {sub.end_date ? `Ends ${new Date(sub.end_date).toLocaleDateString()}` : 'Ongoing'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-primary/20">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Next billing</span>
                      <span className="font-medium">
                        {new Date(new Date(sub.start_date).setMonth(new Date(sub.start_date).getMonth() + 1)).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action list */}
          <div className="mt-6 space-y-3">
            <a href="#" onClick={(e) => { e.preventDefault(); setSubscriptionsDialogOpen(true); }} className="flex items-center justify-between bg-card rounded-full p-4 shadow-sm hover:shadow-warm transition">
              <div className="flex items-center space-x-3">
                <Crown className="h-5 w-5 text-primary" />
                <span className="font-medium">My Subscriptions</span>
              </div>
              <span className="text-muted-foreground text-sm">{'>'}</span>
            </a>

            <a href="#" onClick={(e) => { e.preventDefault(); setOrdersDialogOpen(true); }} className="flex items-center justify-between bg-card rounded-full p-4 shadow-sm hover:shadow-warm transition">
              <div className="flex items-center space-x-3">
                <Package className="h-5 w-5 text-primary" />
                <span className="font-medium">Your Orders</span>
              </div>
              <span className="text-muted-foreground text-sm">{'>'}</span>
            </a>

            <a href="tel:8018602810" className="flex items-center justify-between bg-card rounded-full p-4 shadow-sm hover:shadow-warm transition">
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="font-medium">Help ?</span>
              </div>
              <span className="text-muted-foreground text-sm">Call: 8018602810</span>
            </a>

            <a href="#" onClick={(e) => { e.preventDefault(); setGiftDialogOpen(true); }} className="flex items-center justify-between bg-card rounded-full p-4 shadow-sm hover:shadow-warm transition">
              <div className="flex items-center space-x-3">
                <Badge className="bg-primary/10 text-primary p-1 rounded-md"> 
                  <span className="sr-only">Plans</span>
                </Badge>
                <span className="font-medium">Claim Gift Card</span>
              </div>
              <span className="text-muted-foreground text-sm">{'>'}</span>
            </a>

            <a href="#" onClick={(e) => { e.preventDefault(); setReviewDialogOpen(true); }} className="flex items-center justify-between bg-card rounded-full p-4 shadow-sm hover:shadow-warm transition">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-5 w-5 text-primary" />
                <span className="font-medium">Feedback / Reviews</span>
              </div>
              <span className="text-muted-foreground text-sm">{'>'}</span>
            </a>

            <a href="#" onClick={(e) => { e.preventDefault(); setAddressesDialogOpen(true); }} className="flex items-center justify-between bg-card rounded-full p-4 shadow-sm hover:shadow-warm transition">
              <div className="flex items-center space-x-3">
                <LocateFixed className="h-5 w-5 text-primary" />
                <span className="font-medium">Saved Addresses</span>
              </div>
              <span className="text-muted-foreground text-sm">{'>'}</span>
            </a>
          </div>

          {/* Footer with terms & theme toggle */}
          <div className="mt-8 bg-card rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium">Terms & Policies</span>
            </div>
            <div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // toggle dark class on body
                  const isDark = document.documentElement.classList.toggle('dark');
                  // persist preference
                  try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch {}
                }}
              >
                Toggle
              </Button>
            </div>
          </div>

          {/* Orders Dialog */}
          <Dialog open={ordersDialogOpen} onOpenChange={setOrdersDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Your Orders</DialogTitle>
                <DialogDescription>Track and view your recent orders</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No orders found</div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold">Order #{order.id.slice(-8)}</div>
                          <div className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">₹{order.total_amount}</div>
                          <div className="text-sm text-muted-foreground">{order.status.replace('_',' ')}</div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium">Items</div>
                          <Badge className={getOrderStatusColor((order as any).status)}>
                            {((order as any).status || '').replace('_', ' ')}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          {((order as any).order_items || []).map((oi: any) => (
                            <div key={oi.id} className="flex items-center justify-between bg-muted/10 p-2 rounded-md">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-muted rounded overflow-hidden flex items-center justify-center">
                                  {oi.items?.images?.[0] ? (
                                    <img src={oi.items.images[0]} alt={oi.items?.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-sm">{oi.items?.name || 'Item'}</div>
                                  <div className="text-xs text-muted-foreground">{oi.items?.category || ''}</div>
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="font-semibold">₹{(oi.price || 0) * (oi.quantity || 1)}</div>
                                <div className="text-xs mt-1 flex items-center justify-end">
                                  <span className={`inline-block w-2 h-2 rounded-full ${oi.items?.is_veg ? 'bg-emerald-500' : 'bg-red-500'} mr-2`} />
                                  <span className="text-xs text-muted-foreground">{oi.quantity} pcs</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setOrdersDialogOpen(false)}>Close</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Gift Card Dialog */}
          <Dialog open={giftDialogOpen} onOpenChange={setGiftDialogOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Gift Card / Coupon</DialogTitle>
                <DialogDescription>Enter the coupon code provided by admin to get a discount</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coupon-code">Coupon Code</Label>
                  <Input id="coupon-code" placeholder="Enter coupon code" value={(window as any).__profileCouponInput || ''} onChange={(e) => { (window as any).__profileCouponInput = e.target.value; /* avoid re-render footprint */ }} />
                </div>

                <div className="flex space-x-2">
                  <Button className="flex-1" onClick={() => {
                    // read input from window (minimal change without adding more state)
                    const code = ((window as any).__profileCouponInput || '').trim();
                    if (!code) { toast.error('Please enter a coupon code'); return; }
                    const ok = applyCoupon(code);
                    if (ok) setGiftDialogOpen(false);
                  }}>Apply Coupon</Button>
                  <Button variant="outline" onClick={() => setGiftDialogOpen(false)}>Close</Button>
                </div>
                {coupon && (
                  <div className="text-sm text-muted-foreground">Applied: {coupon.code} · {coupon.percent}% off</div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Subscriptions Dialog */}
          <Dialog open={subscriptionsDialogOpen} onOpenChange={setSubscriptionsDialogOpen}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>My Subscriptions</DialogTitle>
                <DialogDescription>View and manage your active subscription plans</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {subscriptions.length === 0 ? (
                  <div className="text-center py-8">
                    <Crown className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No active subscriptions</p>
                    <Button className="mt-4" onClick={() => { setSubscriptionsDialogOpen(false); window.location.href = '/plans'; }}>Browse Plans</Button>
                  </div>
                ) : (
                  subscriptions.map((sub) => (
                    <div key={sub.id} className="border rounded-lg p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-lg">{sub.plans?.name || 'Unknown Plan'}</h3>
                          <p className="text-sm text-muted-foreground">{sub.plans?.description || ''}</p>
                        </div>
                        <Badge variant={sub.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                          {sub.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-primary" />
                          <div>
                            <div className="text-xs text-muted-foreground">Price</div>
                            <div className="font-semibold">₹{sub.plans?.price}/{sub.plans?.frequency}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <div>
                            <div className="text-xs text-muted-foreground">Frequency</div>
                            <div className="font-semibold capitalize">{sub.plans?.frequency}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <div>
                            <div className="text-xs text-muted-foreground">Start Date</div>
                            <div className="font-semibold">{new Date(sub.start_date).toLocaleDateString()}</div>
                          </div>
                        </div>
                        {sub.end_date && (
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-destructive" />
                            <div>
                              <div className="text-xs text-muted-foreground">End Date</div>
                              <div className="font-semibold">{new Date(sub.end_date).toLocaleDateString()}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {sub.status === 'active' && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-2">Next billing cycle</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Auto-renews on {new Date(new Date(sub.start_date).setMonth(new Date(sub.start_date).getMonth() + 1)).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setSubscriptionsDialogOpen(false)}>Close</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Saved Addresses Dialog */}
          <Dialog open={addressesDialogOpen} onOpenChange={setAddressesDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Saved Addresses</DialogTitle>
                <DialogDescription>Capture your current location and save it to your profile</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Current saved address:</div>
                  <div className="font-medium">{profile?.address || 'No address saved'}</div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={() => {
                    // request geolocation and save
                    if (!navigator.geolocation) {
                      toast.error('Geolocation not supported');
                      return;
                    }
                    setGeoLoading(true);
                    navigator.geolocation.getCurrentPosition(async (pos) => {
                      const { latitude, longitude } = pos.coords;
                      const addressText = `Lat:${latitude.toFixed(6)},Lng:${longitude.toFixed(6)}`;
                      try {
                        // Prefer update by user_id
                        const { data: updated, error: updateError } = await supabase
                          .from('profiles')
                          .update({ address: addressText, updated_at: new Date().toISOString() })
                          .eq('user_id', user!.id)
                          .select();

                        if (updateError) throw updateError;

                        if (!updated || updated.length === 0) {
                          // Fallback: insert a minimal profile record (needs email/full_name ideally)
                          const { error: insertError } = await supabase
                            .from('profiles')
                            .insert([{ user_id: user!.id, address: addressText, full_name: profile?.full_name || '', email: profile?.email || '' }]);
                          if (insertError) throw insertError;
                        }

                        toast.success('Address saved');
                        loadUserData();
                        setAddressesDialogOpen(false);
                      } catch (err) {
                        console.error(err);
                        toast.error('Failed to save address');
                      } finally {
                        setGeoLoading(false);
                      }
                    }, (err) => {
                      console.error(err);
                      toast.error('Failed to capture location');
                      setGeoLoading(false);
                    }, { enableHighAccuracy: true, timeout: 10000 });
                  }} className="flex-1">Capture & Save</Button>
                  <Button variant="outline" onClick={() => setAddressesDialogOpen(false)}>Close</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Logout action */}
          <div className="mt-4">
            <Button variant="ghost" className="w-full" onClick={async () => {
              const { error } = await signOut();
              if (error) {
                toast.error('Sign out failed');
              } else {
                window.location.href = '/auth';
              }
            }}>
              Sign Out
            </Button>
          </div>
        
          {/* Review Dialog (reuse review state defined earlier) */}
          <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Write a Review</DialogTitle>
                <DialogDescription>Share your experience with our food items</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Item</Label>
                  <Select
                    value={reviewForm.item_id}
                    onValueChange={(value) => setReviewForm(prev => ({ ...prev, item_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an item" />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex items-center space-x-2">
                    {[1,2,3,4,5].map((star) => (
                      <Star
                        key={star}
                        className={`h-8 w-8 cursor-pointer ${star <= reviewForm.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Comment (Optional)</Label>
                  <Textarea value={reviewForm.comment} onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))} rows={4} />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleSubmitReview} className="flex-1">Submit Review</Button>
                  <Button variant="outline" onClick={() => { setReviewDialogOpen(false); setReviewForm({ item_id: '', rating: 5, comment: '' }); }}>Cancel</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
