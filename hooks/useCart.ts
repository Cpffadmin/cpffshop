import useCartStore from "@/store/cartStore";

export const useCart = () => {
  const cartTotalQty = useCartStore((state) => state.getTotalItems());
  const items = useCartStore((state) => state.items);

  return {
    cartTotalQty,
    items,
  };
};

export default useCart;
