"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import type { Product, CartItem } from "@/types";
import { useCart } from "@/providers/cart/CartContext";
import ProductDetailsSinglePage from "@/components/ui/ProductDetailsSinglePage";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ShoppingBag } from "lucide-react";
import { useTranslation } from "@/providers/language/LanguageContext";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

// Add this component before the ProductPage component
const ProductDetailsSkeleton = () => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image Skeleton */}
        <div className="aspect-square">
          <LoadingSkeleton height="h-full" rounded />
        </div>

        {/* Details Skeleton */}
        <div className="space-y-6">
          <LoadingSkeleton height="h-8" width="w-3/4" />
          <LoadingSkeleton height="h-4" width="w-1/2" />
          <div className="space-y-4">
            <LoadingSkeleton height="h-4" />
            <LoadingSkeleton height="h-4" />
            <LoadingSkeleton height="h-4" width="w-2/3" />
          </div>
          <div className="flex gap-4">
            <LoadingSkeleton height="h-10" width="w-32" />
            <LoadingSkeleton height="h-10" width="w-32" />
          </div>
        </div>
      </div>

      {/* Description Skeleton */}
      <div className="space-y-4">
        <LoadingSkeleton height="h-6" width="w-1/4" />
        <div className="space-y-2">
          <LoadingSkeleton height="h-4" />
          <LoadingSkeleton height="h-4" />
          <LoadingSkeleton height="h-4" width="w-3/4" />
        </div>
      </div>
    </div>
  );
};

export default function ProductPage() {
  const params = useParams();
  const productId =
    params && typeof params === "object" && "productId" in params
      ? Array.isArray(params.productId)
        ? params.productId[0]
        : params.productId
      : "";
  const { addItem } = useCart();
  const { t, language } = useTranslation();

  // Core states
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [allReviews, setAllReviews] = useState<{ rating: number }[]>([]);

  const breadcrumbItems = [
    {
      label: t("navigation.products"),
      href: "/products",
      icon: ShoppingBag,
    },
    {
      label: product?.category
        ? product.category.displayNames?.[language] || product.category.name
        : t("navigation.products"),
      href: product?.category
        ? `/products?category=${encodeURIComponent(product.category._id)}`
        : `/products?view=all`,
      icon: ShoppingBag,
    },
    {
      label:
        isLoading && !product
          ? t("common.loading")
          : product?.displayNames?.[language] ||
            product?.name ||
            t("common.notFound"),
      href: "#",
      icon: ShoppingBag,
    },
  ];

  // Fetch product data
  useEffect(() => {
    if (!productId) return;

    let isSubscribed = true;
    setIsLoading(true);

    const fetchProduct = async () => {
      try {
        const { data } = await axios.get(`/api/product/${productId}`);
        if (!isSubscribed) return;
        setProduct(data.product);
        setIsLoading(false);
      } catch (err) {
        if (!isSubscribed) return;
        console.error("Failed to fetch product:", err);
        toast.error(t("common.productNotAvailable"));
      }
    };

    fetchProduct();

    return () => {
      isSubscribed = false;
    };
  }, [productId, t]);

  // Fetch reviews
  useEffect(() => {
    if (!productId) return;

    const fetchReviews = async () => {
      try {
        const { data } = await axios.get(`/api/review?productId=${productId}`);
        setAllReviews(data.reviews || []);
        const avg =
          data.reviews.reduce(
            (acc: number, review: { rating: number }) => acc + review.rating,
            0
          ) / data.reviews.length;
        setAverageRating(avg || 0);
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      }
    };

    fetchReviews();
  }, [productId]);

  // Cart functionality
  const handleAddToCart = () => {
    if (!product) return;
    addItem(product);
  };

  // Get the translated title
  const productTitle = React.useMemo(() => {
    if (!product) return "";
    return (
      product.displayNames?.[language] || product.name || t("common.notFound")
    );
  }, [product, language, t]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumbItems} />
      {isLoading && !product ? (
        <ProductDetailsSkeleton />
      ) : !product ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-red-500">{t("common.notFound")}</div>
        </div>
      ) : (
        <ProductDetailsSinglePage
          product={{
            ...product,
            name: product.displayNames?.[language] || product.name || "",
            description:
              product.descriptions?.[language] || product.description || "",
          }}
          handleAddToCart={handleAddToCart}
          averageRating={averageRating}
          allReviews={allReviews}
        />
      )}
    </div>
  );
}
