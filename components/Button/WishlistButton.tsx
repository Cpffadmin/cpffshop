"use client";

import { Heart } from "lucide-react";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  variant?: "icon" | "full";
  className?: string;
}

export function WishlistButton({
  productId,
  variant = "icon",
  className,
}: WishlistButtonProps) {
  const { isInWishlist, toggleWishlist } = useWishlist(productId);

  if (variant === "icon") {
    return (
      <button
        onClick={() => toggleWishlist(productId)}
        className={cn(
          "p-2 rounded-full hover:bg-gray-100 transition-colors",
          isInWishlist ? "text-red-500" : "text-gray-500",
          className
        )}
      >
        <Heart className={isInWishlist ? "fill-current" : ""} size={24} />
      </button>
    );
  }

  return (
    <button
      onClick={() => toggleWishlist(productId)}
      className={cn(
        "w-full flex items-center justify-center px-6 py-3 border rounded-md shadow-sm text-base font-medium transition-colors duration-200",
        isInWishlist
          ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
          : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100",
        className
      )}
    >
      <Heart
        className={cn(
          "w-5 h-5 mr-2",
          isInWishlist ? "fill-current text-red-600" : ""
        )}
      />
      {isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
    </button>
  );
} 