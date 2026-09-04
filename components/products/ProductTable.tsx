"use client";

import { Product } from "@/types";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Edit, Star, ShoppingCart, Ban } from "lucide-react";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useCart } from "@/providers/cart/CartContext";
import { useCartUI } from "@/components/ui/CartUIContext";
import { WishlistButton } from "@/components/ui/WishlistButton";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import useSWR from "swr";
import axios from "axios";
import { useEffect, useState } from "react";
import { SpecificationsModal } from "../ui/SpecificationsModal";

interface ProductTableProps {
  products: Product[];
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

const ProductRow = ({ product: initialProduct }: { product: Product }) => {
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const { language, t } = useTranslation();
  const { addItem } = useCart();
  const { openCart } = useCartUI();
  const { data: session } = useSession();

  // Use SWR to keep product data fresh
  const { data, mutate } = useSWR(
    `/api/product/${initialProduct._id}?language=${language}`,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }
  );

  // Listen for product deletion events
  useEffect(() => {
    const handleProductDelete = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.productId === initialProduct._id) {
        // Force the data to be null and don't revalidate
        mutate(null, false);
      }
    };

    window.addEventListener("product:deleted", handleProductDelete);

    return () => {
      window.removeEventListener("product:deleted", handleProductDelete);
    };
  }, [initialProduct._id, mutate]);

  // If product is deleted or not found, don't render
  if (!data?.product) {
    return null;
  }

  // Use current data only
  const currentProduct = data.product;
  const currentStock = Number(currentProduct.stock ?? 0);
  const isOutOfStock = currentStock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    // If product has specifications, show modal
    if (currentProduct.category?.specifications?.length > 0) {
      setIsSpecModalOpen(true);
      return;
    }

    // If no specifications, add directly to cart
    addItem({
      ...currentProduct,
      basePrice: currentProduct.price,
      price: currentProduct.price,
    });
    openCart();
  };

  return (
    <>
      <div
        className="product-card-surface hover:shadow-lg shadow-md rounded-lg overflow-hidden border border-border transition-colors"
        data-product-id={currentProduct._id}
      >
        <div className="flex items-center gap-3 p-3 sm:p-4">
          <div className="relative h-16 w-16 flex-shrink-0">
            <Image
              src={currentProduct.images[0]}
              alt={currentProduct.name}
              fill
              className="object-cover rounded"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <Link href={`/product/${currentProduct._id}`}>
              <span className="font-medium hover:text-primary block mb-1 sm:mb-0">
                {currentProduct.displayNames?.[language] || currentProduct.name}
              </span>
            </Link>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="font-medium">
                ${currentProduct.price.toFixed(2)}
              </span>
              {currentProduct.originalPrice &&
                currentProduct.originalPrice > currentProduct.price && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${currentProduct.originalPrice.toFixed(2)}
                  </span>
                )}
            </div>
          </div>
          <div className="hidden sm:flex items-center">
            {currentProduct.averageRating &&
            currentProduct.averageRating > 0 ? (
              <>
                <Star className="w-4 h-4 text-primary fill-primary" />
                <span className="ml-1">
                  {currentProduct.averageRating.toFixed(1)} (
                  {currentProduct.numReviews})
                </span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">
                {t("common.noRatingsYet")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <Button
              variant={isOutOfStock ? "destructive" : "default"}
              size="sm"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`hidden sm:inline-flex ${
                isOutOfStock ? "cursor-not-allowed" : ""
              } disabled:opacity-100`}
            >
              {isOutOfStock
                ? t("product.stock.outOfStock")
                : t("common.addToCart")}
            </Button>
            <Button
              variant={isOutOfStock ? "destructive" : "default"}
              size="icon"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={`sm:hidden h-10 w-10 disabled:opacity-100 ${
                isOutOfStock
                  ? "bg-red-500 text-white cursor-not-allowed"
                  : "bg-[#535C91] hover:bg-[#424874] text-white"
              }`}
              title={
                isOutOfStock
                  ? t("product.stock.outOfStock")
                  : t("common.addToCart")
              }
            >
              {isOutOfStock ? (
                <Ban className="h-6 w-6" />
              ) : (
                <ShoppingCart className="h-6 w-6" />
              )}
            </Button>
            <WishlistButton productId={currentProduct._id} variant="icon" />
            {session?.user?.admin && (
              <Link href={`/admin/editProduct/${currentProduct._id}`}>
                <Edit className="w-5 h-5 text-muted-foreground hover:text-primary" />
              </Link>
            )}
          </div>
        </div>
      </div>
      {/* Specifications Modal */}
      <SpecificationsModal
        product={currentProduct}
        isOpen={isSpecModalOpen}
        onClose={() => setIsSpecModalOpen(false)}
      />
    </>
  );
};

const ProductTable: React.FC<ProductTableProps> = ({
  products,
  isLoading = false,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const { t } = useTranslation();
  if (isLoading && products.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <LoadingSkeleton key={i} height="h-16" className="rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        {products.map((product) => (
          <ProductRow key={product._id} product={product} />
        ))}
      </div>

      {/* Pagination */}
      {onPageChange && totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-md border border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t("common.previous")}
          </button>
          <span className="text-sm text-muted-foreground">
            {t("common.pagination", {
              current: currentPage,
              total: totalPages,
            })}
          </span>
          <button
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-md border border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t("common.next")}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductTable;
