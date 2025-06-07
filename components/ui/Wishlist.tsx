import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import useCartStore from "@/store/cartStore";
import { Heart, ShoppingCart, Trash } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/types";
import { useTranslation } from "@/providers/language/LanguageContext";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { useWishlist } from "@/lib/hooks/useWishlist";

// Add this component before the Wishlist component
const WishlistSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <Card
          key={i}
          className="w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden ring-1 ring-gray-200 dark:ring-gray-700"
        >
          <div className="relative">
            <LoadingSkeleton
              height="h-48"
              width="w-full"
              className="rounded-t-lg"
            />
            <div className="absolute top-2 right-2">
              <LoadingSkeleton
                height="h-8"
                width="w-8"
                className="rounded-full"
              />
            </div>
          </div>
          <CardContent className="p-4 space-y-3">
            <LoadingSkeleton height="h-6" width="w-3/4" />
            <LoadingSkeleton height="h-5" width="w-1/2" />
            <div className="flex justify-between items-center pt-2">
              <LoadingSkeleton height="h-8" width="w-24" />
              <LoadingSkeleton height="h-8" width="w-8" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const Wishlist = () => {
  const addItem = useCartStore((state) => state.addItem);
  const { language, t } = useTranslation();
  const {
    wishlistItems: items,
    isLoading,
    isError,
    toggleWishlist,
  } = useWishlist();

  // Add to cart
  const handleAddToCart = (product: Product) => {
    const cartItem = {
      _id: product._id,
      name: product.name,
      price: product.price,
      images: product.images,
      brand: product.brand || "No Brand",
      material: product.material || "Not Specified",
      condition: product.condition || "Not Specified",
      quantity: 1,
    };
    addItem(cartItem);
    toast.success(t("common.addedToCart"));
  };

  if (isLoading) {
    return <WishlistSkeleton />;
  }

  if (isError) {
    return (
      <Card className="w-full bg-white dark:bg-gray-900 shadow-lg rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl">
        <CardHeader className="bg-[#535C91] dark:bg-[#6B74A9] p-6">
          <h2 className="text-3xl font-bold text-white flex items-center">
            <Heart className="mr-2" /> {t("navigation.yourWishlist")}
          </h2>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/50">
          <div className="text-center text-red-500 dark:text-red-400 bg-white/50 dark:bg-gray-800/50 p-8 rounded-lg shadow-sm">
            {t("wishlist.error")}
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="mt-4 bg-white/50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              {t("common.back")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-white dark:bg-gray-900 shadow-lg rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl">
      <CardHeader className="bg-[#535C91] dark:bg-[#6B74A9] p-6">
        <h2 className="text-3xl font-bold text-white flex items-center">
          <Heart className="mr-2" /> {t("wishlist.yourWishlist")}
        </h2>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-4 bg-gray-50 dark:bg-gray-900/50">
        {items.length === 0 ? (
          <div className="bg-white/50 dark:bg-gray-800/50 p-8 rounded-lg shadow-sm text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {t("wishlist.empty")}
            </p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item._id}
              className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg shadow-sm transition-all duration-300 hover:shadow-md group animate-fadeIn"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-4 w-full sm:w-auto">
                  <Image
                    height={500}
                    width={500}
                    src={item.images[0] || "https://via.placeholder.com/100"}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                  <div>
                    <Link href={`/product/${item._id}`}>
                      <p className="font-semibold text-lg text-gray-800 dark:text-gray-100 hover:text-[#535C91] dark:hover:text-[#6B74A9] transition-colors duration-200 cursor-pointer">
                        {item.displayNames?.[language] || item.name}
                      </p>
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none bg-white/50 dark:bg-gray-800/50 text-red-500 dark:text-red-400 border-red-500 dark:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg font-medium transition-all duration-300 focus:outline-none flex items-center justify-center"
                    onClick={() => toggleWishlist(item._id)}
                  >
                    <Trash className="mr-2 h-4 w-4" /> {t("common.remove")}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 sm:flex-none bg-[#535C91] dark:bg-[#6B74A9] text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:bg-[#3a4063] dark:hover:bg-[#535C91] focus:outline-none flex items-center justify-center"
                    onClick={() => handleAddToCart(item)}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />{" "}
                    {t("product.addToCart")}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default Wishlist;
