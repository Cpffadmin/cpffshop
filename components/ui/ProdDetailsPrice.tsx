"use client";
import React from "react";
import { Product } from "@/types";
import { ShoppingCart } from "lucide-react";
import { WishlistButton } from "@/components/ui/WishlistButton";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useCartUI } from "@/components/ui/CartUIContext";
import { cn } from "@/lib/utils";

interface Props {
  product: Product;
  handleAddToCart: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

const ProdDetailsPrice = ({ product, handleAddToCart, className }: Props) => {
  const { language, t } = useTranslation();
  const { openCart } = useCartUI();

  // Get the translated name
  const productName = product.displayNames?.[language] || product.name;

  const onAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    handleAddToCart(e);
    openCart();
  };

  return (
    <div className={cn("bg-card rounded-lg  p-6", className)}>
      <div className="flex flex-col space-y-4">
        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground">{productName}</h1>

        {/* Price */}
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-foreground">
            ${product.price.toFixed(2)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="ml-2 text-xl text-muted-foreground line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Stock Status */}
        <div className="flex items-center">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              Number(product.stock) > 0
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {Number(product.stock) > 0
              ? t("product.inStock")
              : t("product.outOfStock")}
          </span>
        </div>

        {/* Add to Cart and Wishlist Buttons */}
        <div className="flex justify-between items-center gap-4">
          <button
            onClick={onAddToCart}
            disabled={product.stock === 0}
            className={`flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-base font-medium ${
              product.stock === 0
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            } transition-colors duration-200 flex-grow`}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            <span className="whitespace-nowrap text-sm">
              {product.stock === 0
                ? t("product.outOfStock")
                : t("product.addToCart")}
            </span>
          </button>

          {/* Wishlist Button */}
          <WishlistButton
            productId={product._id}
            variant="icon"
            className="p-3 scale-125"
          />
        </div>
      </div>
    </div>
  );
};

export default ProdDetailsPrice;
