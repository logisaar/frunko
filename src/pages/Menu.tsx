
import { useEffect, useState } from "react";
import { getImageUrl } from '@/lib/utils';
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Star, Leaf, Plus, ChefHat } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { Item as FoodItem } from '@/types';
type FoodCategory = "breakfast" | "lunch" | "dinner" | "snacks" | "beverages" | "desserts" | "frunko_bowls";

export default function Menu() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<FoodCategory | "all">("all");
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { addToCart } = useCart();

  const categories: (FoodCategory | "all")[] = [
    "all",
    "beverages",
    "frunko_bowls",
    "desserts",
  ];

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [items, searchQuery, selectedCategory]);

  const loadItems = async () => {
    try {
      const itemsData = await api.getItems(true);
      setItems(itemsData);
    } catch (error: any) {
      console.error("Error loading items:", error);
      if (error.code === "PGRST301" || error.message?.includes("JWT")) {
        toast.error("Session expired. Please sign in again.");
        setTimeout(() => {
          window.location.href = "/auth";
        }, 2000);
      } else {
        toast.error("Failed to load menu items");
      }
    } finally {
      setLoading(false);
    }
  };

  const groupedItems = filteredItems.reduce((acc, item) => {
    const cat = item.category || 'other';
    if (!acc[cat]) { acc[cat] = []; }
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, FoodItem[]>);

  const formatCategoryName = (cat: string) => {
    return cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const filterItems = () => {
    let filtered = items;
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredItems(filtered);
  };

  const handleAddToCart = (item: FoodItem) => {
    addToCart({
      item_id: item.id,
      name: item.name,
      price: item.price,
      image: item.images?.[0],
      is_veg: item.is_veg,
    });
    setDialogOpen(false);
  };

  const openDialog = (item: FoodItem) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF7EE]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F7934C]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF7EE] pb-36 md:pb-24">
      {/* Logo Header */}
      <div className="p-6 flex flex-col items-center justify-center">
        <img
          src="/assets/logo.png"
          alt="Frunko"
          className="w-24 h-24 mb-2"
        />
        <h1 className="text-2xl font-bold text-[#3B1F0A]">FRUNKO</h1>
        <p className="text-sm text-[#6E4E29]">Pay for your health</p>
      </div>

      {/* Greeting + Search Bar */}
      <div className="px-4">
        <h2 className="font-semibold text-lg mb-2 text-[#3B1F0A]">
          Hey Hostel Champ.!
        </h2>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6E4E29] h-5 w-5" />
          <Input
            placeholder="Craving something fresh? Search here..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white rounded-full shadow-sm border-none focus:ring-2 focus:ring-[#F7934C]"
          />
        </div>
      </div>



      {/* Dynamic Category Items Render */}
      {Object.entries(groupedItems).map(([category, catItems]) => (
        <div key={category} className="px-4 mt-6">
          <h3 className="text-xl font-bold text-[#3B1F0A] mb-4">
            {formatCategoryName(category)}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-4">
            {catItems.map((item, index) => (
              <div
                key={item.id}
                className={`glass rounded-2xl overflow-hidden hover:shadow-xl cursor-pointer transition-all duration-300 hover:-translate-y-2 group ${!item.is_available ? 'opacity-80' : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => openDialog(item)}
              >
                <div className="h-32 sm:h-40 overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center relative group-hover:scale-[1.02] transition-transform duration-500">
                  {item.images && item.images.length > 0 && item.images[0] ? (
                    <img
                      src={getImageUrl(item.images[0])}
                      alt={item.name}
                      className={`object-cover w-full h-full ${!item.is_available ? 'grayscale' : ''}`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <ChefHat className="h-10 w-10 text-orange-300" />
                  )}
                  {/* Veg/Non-Veg indicator */}
                  <div className="absolute top-2 right-2 bg-white/90 p-1 rounded-sm shadow-sm backdrop-blur-sm flex gap-1 items-center">
                    <div className={`w-3 h-3 rounded-full ${item.is_veg ? 'bg-green-500' : 'bg-red-500'} `} />
                  </div>
                  {/* Out of stock overlay element if unavailable */}
                  {!item.is_available && (
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center backdrop-blur-[1px]">
                      <span className="text-white font-bold text-sm bg-black/60 px-3 py-1 rounded-full border border-white/20">Out of Stock</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-semibold text-sm text-[#3B1F0A] line-clamp-2 min-h-[40px] leading-tight mb-1">
                    {item.name}
                  </p>
                  <p className="text-sm font-bold text-[#F7934C]">₹{item.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {filteredItems.length === 0 && (
        <div className="px-4 py-12 text-center">
          <p className="text-[#6E4E29]">No items found.</p>
        </div>
      )}

      {/* Product Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-[#3B1F0A]">
              {selectedItem?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Product Image */}
            <div className="flex justify-center">
              {selectedItem?.images && selectedItem.images.length > 0 && selectedItem.images[0] ? (
                <img
                  src={getImageUrl(selectedItem.images[0])}
                  className="w-48 h-48 object-cover rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-48 h-48 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg flex items-center justify-center">
                  <ChefHat className="h-24 w-24 text-orange-400" />
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold text-[#3B1F0A]">
                  ₹{selectedItem?.price}
                </span>
                <div className="flex items-center gap-1">
                  {selectedItem?.is_veg ? (
                    <Leaf className="h-4 w-4 text-green-600" />
                  ) : (
                    <ChefHat className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-xs text-[#6E4E29]">
                    {selectedItem?.is_veg ? "Veg" : "Non-Veg"}
                  </span>
                </div>
              </div>

              {selectedItem?.description && (
                <p className="text-sm text-[#6E4E29] leading-relaxed">
                  {selectedItem.description}
                </p>
              )}
            </div>

            {/* Add to Cart Button */}
            {selectedItem?.is_available ? (
              <Button
                onClick={() => selectedItem && handleAddToCart(selectedItem)}
                className="w-full bg-[#F7934C] hover:bg-[#e9833e] text-white py-3 rounded-lg font-semibold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            ) : (
              <Button
                disabled
                className="w-full bg-gray-300 hover:bg-gray-300 text-gray-500 py-3 rounded-lg font-semibold cursor-not-allowed opacity-80"
              >
                Out of Stock
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
