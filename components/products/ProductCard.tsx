"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { Crown, Edit, Star } from "lucide-react";
import type { Product } from "@/types";
import { WishlistButton } from "@/components/ui/WishlistButton";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useCart } from "@/providers/cart/CartContext";
import { useCartUI } from "@/components/ui/CartUIContext";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { data: session } = useSession();
  const { language, t } = useTranslation();
  const { addItem } = useCart();
  const { openCart } = useCartUI();

  const handleAddToCart = () => {
    addItem(product);
    openCart();
  };

  const handleFeatureToggle = () => {
    const event = new CustomEvent("product:toggleFeature", {
      detail: product._id,
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="bg-card rounded-lg shadow-md overflow-hidden relative border border-border">
      {session?.user?.admin && (
        <>
          <Link
            href={`/admin/editProduct/${product._id}`}
            className="right-iconAssignTop"
            onClick={(e) => e.stopPropagation()}
          >
            <Edit className="w-5 h-5 text-muted-foreground hover:text-primary" />
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleFeatureToggle();
            }}
            className="left-iconAssignTop"
          >
            <Crown
              className={`w-5 h-5 ${
                product.featured
                  ? "text-primary fill-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
            />
          </button>
        </>
      )}
      <Link href={`/product/${product._id}`}>
        <div className="relative h-[30vh] sm:h-64 w-full">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
      </Link>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-4">
        <Link href={`/product/${product._id}`}>
          <h3 className="text-base sm:text-lg font-semibold text-foreground line-clamp-2 ">
            {product.displayNames?.[language] || product.name}
          </h3>
        </Link>
        <div className="flex items-center">
          <div className="flex items-center space-x-1">
            {product.averageRating && product.averageRating > 0 ? (
              <div className="flex items-center">
                <Star className="w-4 h-4 text-primary fill-primary" />
                <span className="ml-1 text-xs sm:text-sm text-muted-foreground">
                  {product.averageRating.toFixed(1)}
                </span>
              </div>
            ) : (
              <span className="text-xs sm:text-sm text-muted-foreground">
                {t("common.noRatingsYet")} ({product.numReviews || 0})
              </span>
            )}
          </div>
          <span className="ml-2 text-xs sm:text-sm text-muted-foreground">
            ({product.numReviews || 0})
          </span>
        </div>
        <div className="flex items-center">
          <p className="text-base sm:text-lg font-bold text-foreground">
            ${product.price.toFixed(2)}
          </p>
          {product.originalPrice && product.originalPrice > product.price && (
            <p className="ml-2 text-xs sm:text-sm text-muted-foreground line-through">
              ${product.originalPrice.toFixed(2)}
            </p>
          )}
        </div>
        <div className="flex justify-between items-center pt-4 mt-4 sm:pt-2 ">
          <button
            onClick={handleAddToCart}
            className="add-to-cart-button text-sm sm:text-base right-iconAssignBottom"
          >
            {t("product.addToCart")}
          </button>
          <WishlistButton
            productId={product._id}
            variant="icon"
            className="left-iconAssignBottom"
          />
        </div>
      </div>
    </div>
  );
}
