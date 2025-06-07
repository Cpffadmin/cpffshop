declare module "@/store/cartStore" {
  import type { CartItem, CartStore } from "@/types";

  const useCartStore: <T extends (state: CartStore) => unknown>(
    selector: T
  ) => ReturnType<T>;
  export default useCartStore;
}
