"use client";

import React, { useEffect, useState } from "react";
import useCartStore from "@/store/cartStore";
import Cart from "@/components/ui/Cart";
import { useCartUI } from "@/components/ui/CartUIContext";
import { Button } from "@/components/ui/button";
import { BsCart3 } from "react-icons/bs";

const CartIcon = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [itemCount, setItemCount] = useState(0);
  const items = useCartStore((state) => state.items);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const { isOpen, openCart, closeCart } = useCartUI();

  useEffect(() => {
    setIsLoading(false);
    setItemCount(getTotalItems());
  }, [items, getTotalItems]);

  if (isLoading) {
    return null;
  }

  return (
    <div className="relative">
      <Button variant="ghost" className="relative" onClick={openCart}>
        <BsCart3 className="text-xl" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </Button>
      {isOpen && <Cart onClose={closeCart} />}
    </div>
  );
};

export default CartIcon;
