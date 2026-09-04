"use client";

import React, { useEffect } from "react";
import { Product } from "@/types";
import { ShoppingCart } from "lucide-react";
import { WishlistButton } from "@/components/ui/WishlistButton";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useCartUI } from "@/components/ui/CartUIContext";
import { cn } from "@/lib/utils";
import useSWR from "swr";
import axios from "axios";

interface Props {
  product: Product;
  selectedSpecs: Record<string, string>;
  handleAddToCart: (
    e: React.MouseEvent<HTMLButtonElement>,
    specs?: Record<string, string>
  ) => void;
  className?: string;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const ProdDetailsPrice = ({
  product: initialProduct,
  selectedSpecs,
  handleAddToCart,
  className,
}: Props) => {
  const { language, t } = useTranslation();
  const { openCart } = useCartUI();

  // Use SWR to keep product data fresh
  const { data, mutate } = useSWR(
    `/api/product/${initialProduct._id}?language=${language}`,
    fetcher,
    {
      fallbackData: { product: initialProduct },
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  // IMPORTANT: Handle stock explicitly to avoid 0 being treated as falsy
  const currentStock = data?.product?.stock ?? initialProduct.stock;
  const currentProduct = data?.product || initialProduct;

  // Listen for product updates - client side only
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleProductUpdate = async (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.productId === initialProduct._id) {
        try {
          // Force fresh fetch with timestamp
          const timestamp = Date.now();
          const response = await axios.get(
            `/api/product/${initialProduct._id}?language=${language}&t=${timestamp}`,
            {
              headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate",
                Pragma: "no-cache",
                Expires: "0",
              },
            }
          );

          // Explicitly handle stock updates and force cache update
          const updatedProduct = {
            ...response.data.product,
            stock:
              customEvent.detail?.updates?.stock ?? response.data.product.stock,
            timestamp: Date.now(), // Add timestamp to force SWR to see it as new data
          };

          // Force SWR to update its cache with the new data
          await mutate(
            { product: updatedProduct },
            {
              revalidate: false, // Don't revalidate again since we just got fresh data
            }
          );
        } catch (error) {
          console.error("Failed to fetch updated product:", error);
          // If fetch fails, force a revalidation
          await mutate();
        }
      }
    };

    window.addEventListener("product:updated", handleProductUpdate);

    return () => {
      window.removeEventListener("product:updated", handleProductUpdate);
    };
  }, [initialProduct._id, language, mutate]);

  // Get the translated name
  const productName =
    currentProduct.displayNames?.[language] || currentProduct.name;

  const onAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log("ProdDetailsPrice - Adding to cart with specs:", selectedSpecs);
    handleAddToCart(e, selectedSpecs);
    openCart();
  };

  return (
    <div className={cn("", className)}>
      <div className="flex flex-col space-y-2">
        {/* Price */}
        <div className="flex items-baseline">
          <span className="text-3xl font-bold text-foreground">
            ${currentProduct.price.toFixed(2)}
          </span>
          {currentProduct.originalPrice &&
            currentProduct.originalPrice > currentProduct.price && (
              <span className="ml-2 text-xl text-muted-foreground line-through">
                ${currentProduct.originalPrice.toFixed(2)}
              </span>
            )}
        </div>

        {/* Stock Status - Use explicit comparison for stock */}
        <div className="flex items-center">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              currentStock > 0
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {currentStock > 0
              ? t("product.stock.inStock")
              : t("product.stock.outOfStock")}
          </span>
        </div>

        {/* Add to Cart and Wishlist Buttons - Use explicit comparison */}
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={onAddToCart}
            disabled={currentStock === 0}
            className={`flex items-center justify-center px-6 py-2.5 border border-transparent rounded-md text-base font-medium ${
              currentStock === 0
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            } transition-colors duration-200 flex-grow`}
            type="button"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            <span className="whitespace-nowrap text-sm">
              {currentStock === 0
                ? t("product.stock.outOfStock")
                : t("common.addToCart")}
            </span>
          </button>

          {/* Wishlist Button */}
          <WishlistButton
            productId={currentProduct._id}
            variant="icon"
            className="p-2.5 scale-125"
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(ProdDetailsPrice, (prevProps, nextProps) => {
  return (
    prevProps.product._id === nextProps.product._id &&
    JSON.stringify(prevProps.selectedSpecs) ===
      JSON.stringify(nextProps.selectedSpecs)
  );
});
