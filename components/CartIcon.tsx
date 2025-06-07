"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BsCart3 } from "react-icons/bs";

const CartIcon = () => {
  return (
    <Link href="/cart">
      <Button variant="ghost" className="relative">
        <BsCart3 className="text-xl" />
      </Button>
    </Link>
  );
};

export default CartIcon;
