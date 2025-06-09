import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, CartStore, AddToCartItem } from "@/types";
import axios from "axios";

const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item: AddToCartItem) =>
        set((state) => {
          const existingItem = state.items.find((i) => i._id === item._id);
          if (existingItem) {
            return state;
          }
          const cartItem: CartItem = {
            _id: item._id,
            name: item.name,
            displayNames: item.displayNames,
            images: item.images,
            price: item.price,
            brand: item.brand,
            quantity: item.quantity || 1,
          };
          return { items: [...state.items, cartItem] };
        }),
      removeItem: (itemId: string) =>
        set((state) => ({
          items: state.items.filter((item) => item._id !== itemId),
        })),
      clearCart: async () => {
        console.log("Clearing cart...");
        // Clear Zustand state
        set({ items: [] });

        // Clear local storage manually
        window.localStorage.removeItem("cart-storage");

        try {
          // Clear server cart
          await axios.patch("/api/userData", { cart: [] });
          console.log("Server cart cleared successfully");
        } catch (error) {
          console.error("Failed to clear server cart:", error);
        }

        // Double check if cart is really cleared
        const currentState = get();
        console.log("Cart state after clearing:", currentState.items);

        // Force a re-render by setting state again if items still exist
        if (currentState.items.length > 0) {
          console.log("Forcing cart clear...");
          set({ items: [] });
        }
      },
      getTotalItems: () =>
        get().items.reduce((total, item) => total + (item.quantity || 1), 0),
      getTotalPrice: () =>
        get().items.reduce(
          (total, item) => total + item.price * (item.quantity || 1),
          0
        ),
      updateItemQuantity: (itemId: string, quantity: number) =>
        set((state) => ({
          items: state.items.map((item) =>
            item._id === itemId ? { ...item, quantity } : item
          ),
        })),
      loadServerCart: async () => {
        try {
          const response = await axios.get("/api/userData");
          if (response.data?.cart) {
            const serverCart = response.data.cart;
            set({ items: serverCart });
          }
        } catch (error) {
          console.error("Failed to load server cart:", error);
        }
      },
    }),
    {
      name: "cart-storage",
      version: 1,
      // Remove skipHydration to ensure proper persistence
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          console.log("Loading cart from storage:", str);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          console.log("Saving cart to storage:", value);
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          console.log("Removing cart from storage:", name);
          localStorage.removeItem(name);
        },
      },
    }
  )
);

export default useCartStore;
