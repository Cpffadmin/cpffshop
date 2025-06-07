"use client";
import React, { createContext, useContext, useState } from "react";

const CartUIContext = createContext<{
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}>({
  isOpen: false,
  openCart: () => {},
  closeCart: () => {},
});

export const CartUIProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  return (
    <CartUIContext.Provider value={{ isOpen, openCart, closeCart }}>
      {children}
    </CartUIContext.Provider>
  );
};

export const useCartUI = () => useContext(CartUIContext);
