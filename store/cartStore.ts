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
      clearCart: () => {
        set({ items: [] });
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
            // Always update with server cart after login
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
      skipHydration: true, // Skip hydration to prevent local storage from overriding server cart
    }
  )
);

export default useCartStore;
