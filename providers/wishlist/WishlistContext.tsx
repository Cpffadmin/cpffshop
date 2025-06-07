"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { toast } from "react-hot-toast";

type WishlistItem = {
  id: string;
  name: string;
  price: number;
  image?: string;
};

type WishlistContextType = {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  clearWishlist: () => void;
  isInWishlist: (id: string) => boolean;
};

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const savedWishlist = localStorage.getItem("wishlist");
    if (savedWishlist) {
      try {
        setItems(JSON.parse(savedWishlist));
      } catch (error) {
        console.error("Failed to parse wishlist from localStorage:", error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(items));
  }, [items]);

  const addItem = (item: WishlistItem) => {
    setItems((current) => {
      const exists = current.some((i) => i.id === item.id);
      if (exists) {
        toast.error("Item already in wishlist");
        return current;
      }
      toast.success("Added to wishlist");
      return [...current, item];
    });
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    toast.success("Removed from wishlist");
  };

  const clearWishlist = () => {
    setItems([]);
    toast.success("Wishlist cleared");
  };

  const isInWishlist = (id: string) => {
    return items.some((item) => item.id === id);
  };

  return (
    <WishlistContext.Provider
      value={{ items, addItem, removeItem, clearWishlist, isInWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
