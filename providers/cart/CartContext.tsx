"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "@/providers/language/LanguageContext";
import useCartStore from "@/store/cartStore";
import { Product, CartItem } from "@/types";
import { useSession } from "next-auth/react";
import AuthDialog from "@/components/ui/AuthDialog";
import axios from "axios";

type CartContextType = {
  items: CartItem[];
  addItem: (item: Product) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { language } = useTranslation();
  const items = useCartStore((state) => state.items);
  const addStoreItem = useCartStore((state) => state.addItem);
  const removeStoreItem = useCartStore((state) => state.removeItem);
  const updateStoreItemQuantity = useCartStore(
    (state) => state.updateItemQuantity
  );
  const clearStoreCart = useCartStore((state) => state.clearCart);
  const loadStoreServerCart = useCartStore((state) => state.loadServerCart);

  const { data: session } = useSession();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [pendingItem, setPendingItem] = useState<Product | null>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const isInitialMount = useRef(true);
  const isSyncing = useRef(false);

  // Load server cart when user logs in
  useEffect(() => {
    const loadCart = async () => {
      if (session?.user) {
        try {
          isSyncing.current = true;
          await loadStoreServerCart();
        } catch (error) {
          console.error("Failed to load cart:", error);
        } finally {
          isSyncing.current = false;
        }
      }
    };

    loadCart();
  }, [session, loadStoreServerCart]);

  // Sync cart with server when it changes
  useEffect(() => {
    // Skip if not logged in or if currently syncing
    if (!session?.user || isSyncing.current) {
      return;
    }

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Set new timeout for sync
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        isSyncing.current = true;
        // Ensure items is a valid array
        if (!Array.isArray(items)) {
          console.warn("Cart items is not an array:", items);
          return;
        }

        await axios.patch(
          "/api/userData",
          { cart: items },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      } catch (error) {
        console.error("Failed to sync cart with server:", error);
      } finally {
        isSyncing.current = false;
      }
    }, 1000); // Debounce for 1 second

    // Cleanup timeout on unmount
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [items, session]);

  const addItem = (item: Product) => {
    if (!session) {
      setPendingItem(item);
      setShowAuthDialog(true);
      return;
    }

    const cartItem: CartItem = {
      _id: item._id,
      name: item.name,
      displayNames: item.displayNames,
      images: item.images,
      price: item.price,
      brand: item.brand,
      quantity: 1,
    };
    addStoreItem(cartItem);
    toast.success("Item added to cart");
  };

  const removeItem = (itemId: string) => {
    removeStoreItem(itemId);
    toast.success("Item removed from cart");
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    updateStoreItemQuantity(itemId, quantity);
  };

  const clearCart = () => {
    clearStoreCart();
    toast.success("Cart cleared");
  };

  const handleAuthDialogClose = () => {
    setShowAuthDialog(false);
    setPendingItem(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
      }}
    >
      {children}
      <AuthDialog isOpen={showAuthDialog} onClose={handleAuthDialogClose} />
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
