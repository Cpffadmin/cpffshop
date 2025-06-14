"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import type { Product } from "@/types";
import useCartStore from "@/store/cartStore";
import ProductDetailsSinglePage from "@/components/ui/ProductDetailsSinglePage";

export default function ProductPage() {
  const params = useParams();
  const productId =
    params && typeof params === "object" && "productId" in params
      ? Array.isArray(params.productId)
        ? params.productId[0]
        : params.productId
      : "";
  const addToCart = useCartStore((state) => state.addItem);

  // Core states
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [allReviews, setAllReviews] = useState<{ rating: number }[]>([]);

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
        toast.error("Could not load product details");
      }
    };

    fetchProduct();

    return () => {
      isSubscribed = false;
    };
  }, [productId]);

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

    addToCart({
      _id: product._id,
      name: product.name,
      displayNames: product.displayNames,
      images: product.images,
      price: product.price,
      brand: product.brand || "No Brand",
      material: product.material || "Not Specified",
      condition: product.condition || "Not Specified",
      quantity: 1,
    });

    toast.success("Added to cart!");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">Product not found</div>
      </div>
    );
  }

  return (
    <ProductDetailsSinglePage
      product={product}
      handleAddToCart={handleAddToCart}
      averageRating={averageRating}
      allReviews={allReviews}
      setAllReviews={setAllReviews}
      setAverageRating={setAverageRating}
    />
  );
}
