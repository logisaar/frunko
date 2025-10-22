import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Star, Leaf, Plus, ChefHat } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type FoodItem = Database["public"]["Tables"]["items"]["Row"];
type FoodCategory = Database["public"]["Enums"]["food_category"];

export default function Menu() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<FoodCategory | "all">("all");
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const categories: (FoodCategory | "all")[] = [
    "all",
    "Nutri-shakes",
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
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("is_available", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setItems(data || []);
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
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF7EE]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F7934C]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF7EE] pb-20">
      {/* Logo Header */}
      <div className="p-6 flex flex-col items-center justify-center">
        <img
          src="/assets/logo.png"
          alt="Frunko"
          className="w-24 h-24 mb-2"
        />
        <h1 className="text-2xl font-bold text-[#3B1F0A]">FRuNKO</h1>
        <p className="text-sm text-[#6E4E29]">Pay for your health</p>
      </div>

      {/* Greeting + Search Bar */}
      <div className="px-4">
        <h2 className="font-semibold text-lg mb-2 text-[#3B1F0A]">
          Hey Hostel Champ!
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

      {/* Promo Banners */}
      <div className="px-4 overflow-x-auto flex gap-4 pb-4 hide-scrollbar">
        <img
          src="/assets/veggie salad.png"
          alt="Daily Fresh Bowls"
          className="w-64 h-40 rounded-xl object-cover flex-shrink-0"
        />
        <img
          src="/assets/mix_fruitboul_with-curd.png"
          alt="Hydrate & Energize"
          className="w-64 h-40 rounded-xl object-cover flex-shrink-0"
        />
        <img
          src="/assets/chocolate oats.png"
          alt="Hostel Combos Save More"
          className="w-64 h-40 rounded-xl object-cover flex-shrink-0"
        />
        <img
          src="/assets/mix_fruit_bowl.png"
          alt="Hostel Combos Save More"
          className="w-64 h-40 rounded-xl object-cover flex-shrink-0"
        />
      </div>

      {/* Fruits A–Z */}
      <div className="px-4 mt-4">
        <h3 className="text-lg font-semibold text-[#3B1F0A] mb-3">Fruits A–Z</h3>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
          {filteredItems.slice(0, 5).map((item) => (
            <div
              key={item.id}
              className="flex flex-col items-center text-center flex-shrink-0"
            >
              <div className="w-16 h-16 rounded-full bg-white shadow flex items-center justify-center overflow-hidden">
                {item.images?.[0] ? (
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <ChefHat className="text-[#6E4E29] h-6 w-6" />
                )}
              </div>
              <p className="text-sm font-medium mt-2 text-[#3B1F0A]">
                {item.name}
              </p>
              <p className="text-xs text-[#6E4E29]">₹{item.price}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Juices & Smoothies */}
      <div className="px-4 mt-2">
        <h3 className="text-lg font-semibold text-[#3B1F0A] mb-3">
          Juices & Smoothies
        </h3>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
          {filteredItems.slice(5, 10).map((item) => (
            <Card
              key={item.id}
              className="w-40 flex-shrink-0 rounded-xl overflow-hidden bg-white shadow"
            >
              <div className="h-32 overflow-hidden">
                <img
                  src={item.images?.[0] || "/images/juice.jpg"}
                  alt={item.name}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm text-[#3B1F0A] line-clamp-1">
                  {item.name}
                </p>
                <p className="text-xs text-[#6E4E29] mb-2">₹{item.price}</p>
                <Button
                  size="sm"
                  className="bg-[#F7934C] hover:bg-[#e9833e] text-white text-xs px-3 py-1 rounded-full"
                  onClick={() => handleAddToCart(item)}
                >
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Popular Items */}
      <div className="px-4 mt-4">
        <h3 className="text-lg font-semibold text-[#3B1F0A] mb-3">
          Popular Items
        </h3>
        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
          {filteredItems.slice(10, 16).map((item) => (
            <Card
              key={item.id}
              className="w-36 flex-shrink-0 rounded-xl bg-white shadow"
            >
              <img
                src={item.images?.[0] || "/images/bowl.jpg"}
                alt={item.name}
                className="w-full h-28 object-cover rounded-t-xl"
              />
              <div className="p-2">
                <p className="font-semibold text-sm text-[#3B1F0A] line-clamp-1">
                  {item.name}
                </p>
                <p className="text-xs text-[#6E4E29] mb-2">₹{item.price}</p>
                <Button
                  size="sm"
                  className="bg-[#F7934C] hover:bg-[#e9833e] text-white text-xs w-full rounded-full"
                  onClick={() => handleAddToCart(item)}
                >
                  Add
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
