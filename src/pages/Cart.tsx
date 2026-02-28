import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';
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
  X,
  Navigation,
  Home,
  Briefcase,
  MoreHorizontal,
  Star,
  Check,
  Loader2,
  MapPinOff,
  Save,
  LocateFixed,
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { toast } from 'sonner';

declare global {
  interface Window {
    mappls: any;
    initMap: () => void;
    Paytm?: {
      CheckoutJS: {
        init: (config: any) => Promise<void>;
        invoke: () => void;
      };
    };
  }
}

const LABEL_ICONS: Record<string, any> = {
  Home: Home,
  Work: Briefcase,
  Other: MoreHorizontal,
};

export default function Cart() {
  const { items, updateQuantity, removeFromCart, clearCart, getTotalPrice, getTotalItems, addToCart } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Address state
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('Home');
  const [newAddressText, setNewAddressText] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [saveAddress, setSaveAddress] = useState(true);
  const [addressLoading, setAddressLoading] = useState(false);

  // Map state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Other
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [activeStep, setActiveStep] = useState<'cart' | 'address' | 'summary'>('cart');

  // Handle weekly selection
  useEffect(() => {
    const weeklySelection = location.state?.weeklySelection;
    if (weeklySelection && Array.isArray(weeklySelection)) {
      weeklySelection.forEach(dayData => {
        dayData.items.forEach(({ item, quantity }: any) => {
          if (item && quantity > 0) {
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
      navigate('/cart', { replace: true, state: {} });
    }
  }, []);

  // Load saved addresses
  const loadAddresses = useCallback(async () => {
    if (!user) return;
    try {
      const addrs = await api.getAddresses();
      setSavedAddresses(addrs);
      const def = addrs.find((a: any) => a.isDefault);
      if (def) {
        setSelectedAddressId(def.id);
        if (def.latitude && def.longitude) {
          setCoords({ lat: def.latitude, lng: def.longitude });
        }
      }
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => { loadAddresses(); }, [loadAddresses]);

  // Init Mappls map — only when on address step
  useEffect(() => {
    if (activeStep !== 'address') return;
    if (mapRef.current) return; // Already initialized

    let pollInterval: ReturnType<typeof setInterval>;
    let attempts = 0;

    const initializeMap = () => {
      const container = document.getElementById('mappls-map-container');
      if (!container || !window.mappls?.Map) return false;

      try {
        const map = new window.mappls.Map('mappls-map-container', {
          center: coords ? [coords.lat, coords.lng] : [28.6139, 77.2090],
          zoom: 15,
          zoomControl: true,
          search: false,
        });

        map.on('load', () => {
          mapRef.current = map;
          setMapReady(true);

          map.on('click', (e: any) => {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            setCoords({ lat, lng });
            placeMarkerOnMap(lat, lng, map);
            reverseGeocode(lat, lng);
          });

          if (coords) {
            placeMarkerOnMap(coords.lat, coords.lng, map);
          }
        });

        return true;
      } catch (err) {
        console.error('Map init error:', err);
        return false;
      }
    };

    // Poll until SDK is loaded and container is rendered
    pollInterval = setInterval(() => {
      attempts++;
      if (initializeMap() || attempts > 50) {
        clearInterval(pollInterval);
      }
    }, 200);

    return () => {
      clearInterval(pollInterval);
    };
  }, [activeStep]);

  const placeMarkerOnMap = (lat: number, lng: number, map?: any) => {
    const targetMap = map || mapRef.current;
    if (!targetMap || !window.mappls) return;
    if (markerRef.current) {
      try { markerRef.current.remove(); } catch { /* ignore */ }
    }
    markerRef.current = new window.mappls.Marker({
      map: targetMap,
      position: { lat, lng },
      draggable: true,
    });
    markerRef.current.on('dragend', (e: any) => {
      const pos = markerRef.current.getPosition();
      setCoords({ lat: pos.lat, lng: pos.lng });
      reverseGeocode(pos.lat, pos.lng);
    });
    targetMap.setCenter({ lat, lng });
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const data = await api.reverseGeocode(lat, lng);
      if (data.results?.[0]) {
        const r = data.results[0];
        const addr = r.formatted_address || [r.street, r.subLocality, r.locality, r.city, r.state, r.pincode].filter(Boolean).join(', ');
        setNewAddressText(addr);
        setShowNewAddress(true);
        setSelectedAddressId(null);
        toast.success('📍 Location found!');
      } else {
        setNewAddressText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        setShowNewAddress(true);
        toast.info('Location pinned — please enter address details');
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
      setNewAddressText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      setShowNewAddress(true);
      toast.info('Location pinned — please enter address details');
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });
        placeMarkerOnMap(lat, lng);
        reverseGeocode(lat, lng);
        setGpsLoading(false);
      },
      (err) => {
        toast.error('Unable to get your location. Please allow location access.');
        setGpsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSaveNewAddress = async () => {
    if (!newAddressText.trim()) {
      toast.error('Please enter or select an address');
      return;
    }
    setAddressLoading(true);
    try {
      const addr = await api.createAddress({
        label: newAddressLabel,
        fullAddress: newAddressText,
        latitude: coords?.lat,
        longitude: coords?.lng,
        landmark: newLandmark || undefined,
        isDefault: savedAddresses.length === 0,
      });
      setSavedAddresses(prev => [...prev, addr]);
      setSelectedAddressId(addr.id);
      setShowNewAddress(false);
      setNewAddressText('');
      setNewLandmark('');
      toast.success('Address saved!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save address');
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await api.deleteAddress(id);
      setSavedAddresses(prev => prev.filter(a => a.id !== id));
      if (selectedAddressId === id) setSelectedAddressId(null);
      toast.success('Address removed');
    } catch { toast.error('Failed to delete'); }
  };

  // Coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const result = await api.validateCoupon(couponCode, getTotalPrice());
      setAppliedCoupon(result);
      toast.success(`Coupon applied! You save ₹${result.discount}`);
    } catch (err: any) {
      toast.error(err.message || 'Invalid coupon');
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const calculateDiscount = () => appliedCoupon?.discount || 0;
  const subtotal = getTotalPrice();
  const discount = calculateDiscount();
  const tax = Math.round((subtotal - discount) * 0.05);
  const deliveryFee = subtotal > 500 ? 0 : 30;
  const total = subtotal - discount + tax + deliveryFee;

  const selectedAddress = savedAddresses.find(a => a.id === selectedAddressId);
  const deliveryAddressText = selectedAddress?.fullAddress || newAddressText;

  const handleCheckout = async () => {
    if (!user) { toast.error('Please login first'); navigate('/auth'); return; }
    if (!deliveryAddressText.trim()) { toast.error('Please select a delivery address'); setActiveStep('address'); return; }
    if (items.length === 0) { toast.error('Your cart is empty'); return; }

    setIsCheckingOut(true);
    try {
      // 1. Create the order
      const orderData = await api.createOrder({
        totalAmount: total,
        deliveryAddress: deliveryAddressText,
        couponCode: appliedCoupon?.code || undefined,
        discountAmount: discount || undefined,
        items: items.map(item => ({
          itemId: item.item_id,
          quantity: item.quantity,
          price: Number(item.price)
        }))
      });

      toast.success('Order created! Opening payment...');

      // 2. Initiate Paytm transaction
      const paytmData = await api.initiatePaytmPayment(
        orderData.id,
        total,
        user?.email,
        user?.phone,
      );

      // 3. Open Paytm Checkout overlay
      if (window.Paytm && window.Paytm.CheckoutJS) {
        const config = {
          root: '',
          flow: 'DEFAULT',
          data: {
            orderId: paytmData.orderId,
            token: paytmData.txnToken,
            tokenType: 'TXN_TOKEN',
            amount: paytmData.amount,
          },
          merchant: {
            mid: paytmData.mid,
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
        toast.error('Payment gateway not loaded. Please refresh and try again.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to place order');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // ==================== RENDER ====================

  if (items.length === 0 && activeStep === 'cart') {
    return (
      <div className="min-h-screen bg-warm-bg mobile-nav-spacing flex items-center justify-center">
        <Card className="glass max-w-md w-full mx-4 text-center">
          <CardContent className="py-16 space-y-6">
            <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-orange-100 rounded-full flex items-center justify-center mx-auto">
              <ShoppingCart className="h-12 w-12 text-primary/60" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Your cart is empty</h2>
              <p className="text-muted-foreground mt-2">Add some delicious items to get started!</p>
            </div>
            <Button className="w-full bg-gradient-to-r from-primary to-orange-500 text-white font-semibold py-3 rounded-2xl" onClick={() => navigate('/menu')}>
              <ChefHat className="h-4 w-4 mr-2" /> Browse Menu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-bg mobile-nav-spacing">
      <div className="max-w-6xl mx-auto p-4 pt-6">
        {/* Stepper */}
        <div className="flex items-center justify-center mb-8">
          {['cart', 'address', 'summary'].map((step, i) => {
            const labels = ['Cart', 'Delivery', 'Summary'];
            const icons = [ShoppingCart, MapPin, CreditCard];
            const Icon = icons[i];
            const isActive = activeStep === step;
            const isPast = ['cart', 'address', 'summary'].indexOf(activeStep) > i;
            return (
              <div key={step} className="flex items-center">
                <button
                  onClick={() => {
                    if (isPast || isActive) setActiveStep(step as any);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105' : isPast ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}
                >
                  {isPast ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  <span className="hidden sm:inline">{labels[i]}</span>
                </button>
                {i < 2 && <div className={`w-8 sm:w-16 h-0.5 mx-1 ${isPast ? 'bg-green-400' : 'bg-muted'}`} />}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Main content based on step */}
          <div className="lg:col-span-2 space-y-4">
            {/* ========== STEP 1: CART ========== */}
            {activeStep === 'cart' && (
              <Card className="glass overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-orange-50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    Your Cart
                    <Badge className="ml-2 bg-primary text-white">{getTotalItems()} items</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 divide-y">
                  {items.map((item) => (
                    <div key={item.item_id} className="flex items-center p-4 hover:bg-muted/30 transition-colors group">
                      {/* Image */}
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 ring-2 ring-primary/10">
                        {item.image ? (
                          <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ChefHat className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 ml-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-sm border-2 ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full m-[1px] ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`} />
                          </div>
                          <h3 className="font-semibold text-sm">{item.name}</h3>
                        </div>
                        <p className="text-primary font-bold mt-1">₹{Number(item.price).toFixed(0)}</p>
                      </div>

                      {/* Quantity + Remove */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center bg-primary/10 rounded-xl overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-2 hover:bg-primary/20 transition-colors"
                          >
                            <Minus className="h-3.5 w-3.5 text-primary" />
                          </button>
                          <span className="px-3 font-bold text-sm min-w-[2rem] text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 hover:bg-primary/20 transition-colors"
                          >
                            <Plus className="h-3.5 w-3.5 text-primary" />
                          </button>
                        </div>
                        <span className="font-bold text-sm min-w-[60px] text-right">
                          ₹{(Number(item.price) * item.quantity).toFixed(0)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* ========== STEP 2: ADDRESS ========== */}
            {activeStep === 'address' && (
              <div className="space-y-4">
                {/* Map */}
                <Card className="glass overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      Delivery Location
                    </CardTitle>
                    <CardDescription>Tap on the map or use GPS to set your delivery point</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div id="mappls-map-container" className="w-full h-[280px] bg-muted relative">
                      {!mapReady && (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 z-10">
                          <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                            <p className="text-sm text-muted-foreground mt-2">Loading map...</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleUseMyLocation}
                        disabled={gpsLoading}
                        className="flex-1 rounded-xl"
                      >
                        {gpsLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LocateFixed className="h-4 w-4 mr-2" />}
                        Use My Location
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Saved Addresses */}
                {savedAddresses.length > 0 && (
                  <Card className="glass">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        Saved Addresses
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {savedAddresses.map(addr => {
                        const LabelIcon = LABEL_ICONS[addr.label] || MapPin;
                        const isSelected = selectedAddressId === addr.id;
                        return (
                          <div
                            key={addr.id}
                            onClick={() => {
                              setSelectedAddressId(addr.id);
                              setShowNewAddress(false);
                              if (addr.latitude && addr.longitude) {
                                setCoords({ lat: addr.latitude, lng: addr.longitude });
                                placeMarkerOnMap(addr.latitude, addr.longitude);
                              }
                            }}
                            className={`flex items-center p-3 rounded-xl cursor-pointer transition-all border-2 ${isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-transparent hover:bg-muted/50'}`}
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                              <LabelIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 ml-3 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">{addr.label}</span>
                                {addr.isDefault && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Default</Badge>}
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{addr.fullAddress}</p>
                              {addr.landmark && <p className="text-[10px] text-muted-foreground/70">📍 {addr.landmark}</p>}
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              {isSelected && <Check className="h-5 w-5 text-primary" />}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id); }}
                                className="p-1.5 text-muted-foreground/50 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}

                {/* Add New Address */}
                <Card className="glass">
                  <CardContent className="pt-4">
                    {!showNewAddress ? (
                      <Button variant="outline" className="w-full rounded-xl border-dashed border-2" onClick={() => { setShowNewAddress(true); setSelectedAddressId(null); }}>
                        <Plus className="h-4 w-4 mr-2" /> Add New Address
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          {['Home', 'Work', 'Other'].map(label => (
                            <button
                              key={label}
                              onClick={() => setNewAddressLabel(label)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${newAddressLabel === label ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                            >
                              {label === 'Home' && <Home className="h-3 w-3" />}
                              {label === 'Work' && <Briefcase className="h-3 w-3" />}
                              {label === 'Other' && <MoreHorizontal className="h-3 w-3" />}
                              {label}
                            </button>
                          ))}
                        </div>
                        <div>
                          <Label className="text-xs">Full Address</Label>
                          <Textarea
                            id="new-address-text"
                            name="fullAddress"
                            value={newAddressText}
                            onChange={(e) => setNewAddressText(e.target.value)}
                            placeholder="Enter or select from map..."
                            className="mt-1 rounded-xl text-sm"
                            rows={2}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Landmark (optional)</Label>
                          <Input
                            id="new-address-landmark"
                            name="landmark"
                            value={newLandmark}
                            onChange={(e) => setNewLandmark(e.target.value)}
                            placeholder="Near park, opposite mall..."
                            className="mt-1 rounded-xl text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleSaveNewAddress} disabled={addressLoading} className="flex-1 rounded-xl bg-gradient-to-r from-primary to-orange-500 text-white">
                            {addressLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Save & Use
                          </Button>
                          <Button variant="ghost" onClick={() => setShowNewAddress(false)} className="rounded-xl">Cancel</Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ========== STEP 3: SUMMARY ========== */}
            {activeStep === 'summary' && (
              <div className="space-y-4">
                {/* Delivery To */}
                <Card className="glass">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground font-medium">Delivering to</p>
                        <p className="text-sm font-semibold truncate">{selectedAddress?.label || 'Selected Address'}</p>
                        <p className="text-xs text-muted-foreground truncate">{deliveryAddressText}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setActiveStep('address')} className="text-primary text-xs">Change</Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Item Summary */}
                <Card className="glass">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-primary" />
                      Order Items
                      <Badge className="ml-auto">{getTotalItems()}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {items.map(item => (
                      <div key={item.item_id} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-sm border ${item.is_veg ? 'border-green-600 bg-green-100' : 'border-red-600 bg-red-100'}`} />
                          <span className="text-sm">{item.name}</span>
                          <span className="text-muted-foreground text-xs">×{item.quantity}</span>
                        </div>
                        <span className="font-semibold text-sm">₹{(Number(item.price) * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Special Instructions */}
                <Card className="glass">
                  <CardContent className="py-4">
                    <Label className="text-sm font-semibold">Special Instructions</Label>
                    <Textarea
                      id="special-instructions"
                      name="specialInstructions"
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="e.g., Less spicy, extra napkins, ring doorbell..."
                      className="mt-2 rounded-xl text-sm"
                      rows={2}
                    />
                  </CardContent>
                </Card>

                {/* Coupon */}
                <Card className="glass">
                  <CardContent className="py-4">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Tag className="h-4 w-4 text-primary" /> Apply Coupon
                    </Label>
                    {appliedCoupon ? (
                      <div className="mt-2 flex items-center justify-between bg-green-50 p-3 rounded-xl border border-green-200">
                        <div>
                          <span className="font-bold text-green-700">{appliedCoupon.code}</span>
                          <span className="text-green-600 text-sm ml-2">−₹{appliedCoupon.discount}</span>
                        </div>
                        <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-red-500 hover:text-red-700">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="coupon-code"
                          name="couponCode"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Enter coupon code"
                          className="rounded-xl text-sm"
                        />
                        <Button onClick={handleApplyCoupon} disabled={couponLoading} variant="outline" className="rounded-xl whitespace-nowrap">
                          {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right: Bill Summary (always visible) */}
          <div className="space-y-4">
            <Card className="glass sticky top-4">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-orange-50 border-b pb-3">
                <CardTitle className="text-lg">Bill Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Item Total</span>
                  <span className="font-medium">₹{subtotal.toFixed(0)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Coupon Discount</span>
                    <span>−₹{discount.toFixed(0)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">GST (5%)</span>
                  <span className="font-medium">₹{tax.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Fee</span>
                  <span className={`font-medium ${deliveryFee === 0 ? 'text-green-600' : ''}`}>
                    {deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}
                  </span>
                </div>
                {deliveryFee === 0 && (
                  <p className="text-[10px] text-green-600 text-right">Free delivery on orders above ₹500!</p>
                )}
                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                  <span>To Pay</span>
                  <span className="text-primary">₹{total.toFixed(0)}</span>
                </div>

                {/* Action button based on step */}
                {activeStep === 'cart' && (
                  <Button
                    className="w-full rounded-2xl py-6 text-base font-bold bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/30 hover:shadow-xl transition-all"
                    onClick={() => setActiveStep('address')}
                  >
                    <MapPin className="h-5 w-5 mr-2" /> Select Delivery Address
                  </Button>
                )}
                {activeStep === 'address' && (
                  <Button
                    className="w-full rounded-2xl py-6 text-base font-bold bg-gradient-to-r from-primary to-orange-500 text-white shadow-lg shadow-primary/30 hover:shadow-xl transition-all"
                    onClick={() => {
                      if (!selectedAddressId && !newAddressText.trim()) {
                        toast.error('Please select or add a delivery address');
                        return;
                      }
                      setActiveStep('summary');
                    }}
                  >
                    <CreditCard className="h-5 w-5 mr-2" /> Review Order
                  </Button>
                )}
                {activeStep === 'summary' && (
                  <Button
                    className="w-full rounded-2xl py-6 text-base font-bold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 hover:shadow-xl transition-all"
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                  >
                    {isCheckingOut ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Placing Order...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5 mr-2" /> Pay ₹{total.toFixed(0)}
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Delivery info card */}
            {selectedAddress && (
              <Card className="glass">
                <CardContent className="py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-xs">{selectedAddress.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{selectedAddress.fullAddress}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
