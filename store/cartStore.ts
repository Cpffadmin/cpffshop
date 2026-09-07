import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, CartStore, AddToCartItem } from "@/types";
import axios from "axios";
import { cachedGet, invalidateCache } from "@/utils/services/clientCache";

// Two cart lines are the same product only when their chosen options match too,
// because option values can carry their own price.
const sameSpecifications = (
  current: Record<string, any> = {},
  incoming: Record<string, any> = {}
) => {
  const currentKeys = Object.keys(current).sort();
  const incomingKeys = Object.keys(incoming).sort();

  if (currentKeys.length !== incomingKeys.length) return false;
  if (!currentKeys.every((key, idx) => key === incomingKeys[idx])) return false;

  return currentKeys.every((key) => {
    const currentValue = current[key];
    const incomingValue = incoming[key];

    // Multilingual option values
    if (
      typeof currentValue === "object" &&
      typeof incomingValue === "object" &&
      currentValue !== null &&
      incomingValue !== null
    ) {
      return (
        currentValue.en === incomingValue.en &&
        currentValue["zh-TW"] === incomingValue["zh-TW"]
      );
    }

    return currentValue === incomingValue;
  });
};

// Shared by addItem and addItems so a single add and a bulk add merge identically.
const mergeCartItem = (
  items: CartItem[],
  item: AddToCartItem
): CartItem[] => {
  const existingIndex = items.findIndex(
    (existing) =>
      existing._id === item._id &&
      sameSpecifications(
        existing.selectedSpecifications,
        item.selectedSpecifications
      )
  );

  if (existingIndex !== -1) {
    const merged = [...items];
    merged[existingIndex] = {
      ...merged[existingIndex],
      price: item.price,
      basePrice: item.basePrice,
      quantity: (merged[existingIndex].quantity || 1) + (item.quantity || 1),
    };
    return merged;
  }

  return [
    ...items,
    {
      _id: item._id,
      name: item.name,
      displayNames: item.displayNames,
      images: item.images,
      price: item.price,
      basePrice: item.basePrice,
      brand: item.brand,
      category: item.category,
      quantity: item.quantity || 1,
      selectedSpecifications: item.selectedSpecifications || {},
    },
  ];
};

const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      selectedDeliveryType: 0,
      addItem: (item: AddToCartItem) =>
        set((state) => ({
          ...state,
          items: mergeCartItem(state.items, item),
        })),
      // One state update for a whole order sheet, so the cart does not re-render
      // and re-sync once per line.
      addItems: (newItems: AddToCartItem[]) =>
        set((state) => ({
          ...state,
          items: newItems.reduce(
            (items, item) => mergeCartItem(items, item),
            state.items
          ),
        })),
      removeItem: (itemId: string, selectedSpecs?: Record<string, any>) =>
        set((state) => ({
          ...state,
          items: state.items.filter((item) => {
            // If no specs provided, use old behavior
            if (!selectedSpecs) return item._id !== itemId;

            // If specs provided, match both ID and specs
            if (item._id !== itemId) return true;

            const currentSpecs = item.selectedSpecifications || {};
            const targetSpecs = selectedSpecs || {};
            const currentKeys = Object.keys(currentSpecs).sort();
            const targetKeys = Object.keys(targetSpecs).sort();

            // If different number of specs, not the same item
            if (currentKeys.length !== targetKeys.length) return true;

            // Check if all keys match
            if (!currentKeys.every((key, idx) => key === targetKeys[idx]))
              return true;

            // Check each specification value
            return !currentKeys.every((key) => {
              const currentValue = currentSpecs[key];
              const targetValue = targetSpecs[key];

              // If both values are objects (multilingual values)
              if (
                typeof currentValue === "object" &&
                typeof targetValue === "object" &&
                currentValue !== null &&
                targetValue !== null
              ) {
                return (
                  currentValue.en === targetValue.en &&
                  currentValue["zh-TW"] === targetValue["zh-TW"]
                );
              }

              // For simple values
              return currentValue === targetValue;
            });
          }),
        })),
      // Returns false when the account cart could not be emptied, so callers can
      // warn instead of reporting success — otherwise the items silently return
      // on the next refresh via loadServerCart.
      clearCart: async () => {
        set({ items: [], selectedDeliveryType: 0 });
        window.localStorage.removeItem("cart-storage");
        try {
          await axios.patch("/api/userData", { cart: [] });
          // Server cart changed; drop cached userData so reloads are fresh.
          invalidateCache("/api/userData");
          return true;
        } catch (error) {
          console.error("Failed to clear server cart:", error);
          return false;
        }
      },
      // Resets the cart in this browser only, WITHOUT touching the server copy.
      // Used on logout so the account cart survives and reloads on next login,
      // while the next person on this device doesn't inherit the items.
      clearLocalCart: () => {
        set({ items: [], selectedDeliveryType: 0 });
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("cart-storage");
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
          ...state,
          items: state.items.map((item) =>
            item._id === itemId ? { ...item, quantity } : item
          ),
        })),
      loadServerCart: async () => {
        try {
          // Shared with UserContext via cachedGet so the many callers
          // (CartIcon mount + CartContext effect) collapse into one request.
          // /api/userData returns the cart nested under `user`, not top-level.
          const data = await cachedGet<{ user?: { cart?: CartItem[] } }>(
            "/api/userData"
          );
          const serverCart = data?.user?.cart;
          const localItems = get().items;

          if (!Array.isArray(serverCart)) return;

          // Only hydrate from the server when the local cart is empty but the
          // account cart has items (e.g. after logout/login on another device).
          // NEVER replace a non-empty local cart with an empty server cart — that
          // was wiping items when the user opened checkout before the 1s sync ran.
          if (serverCart.length > 0 && localItems.length === 0) {
            set((state) => ({ ...state, items: serverCart as CartItem[] }));
          }
        } catch (error) {
          console.error("Failed to load server cart:", error);
        }
      },
      setSelectedDeliveryType: (type: number) => {
        set((state) => ({ ...state, selectedDeliveryType: type }));
      },
    }),
    {
      name: "cart-storage",
      version: 1,
      storage: createJSONStorage(() => {
        // Check if window is defined (client-side)
        if (typeof window !== "undefined") {
          return {
            getItem: (name) => {
              try {
                const str = localStorage.getItem(name);
                console.log("Loading cart from storage:", str);
                if (!str) return null;
                const data = JSON.parse(str);
                return data;
              } catch (error) {
                console.error("Failed to parse cart storage:", error);
                return null;
              }
            },
            setItem: (name, value) => {
              console.log("Saving cart to storage:", value);
              try {
                localStorage.setItem(name, JSON.stringify(value));
              } catch (error) {
                console.error("Failed to save cart to storage:", error);
              }
            },
            removeItem: (name) => {
              console.log("Removing cart from storage:", name);
              localStorage.removeItem(name);
            },
          };
        }
        // Return no-op storage for server-side
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        items: state.items,
        selectedDeliveryType: state.selectedDeliveryType,
      }),
    }
  )
);

export default useCartStore;
