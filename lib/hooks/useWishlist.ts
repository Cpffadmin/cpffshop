import { useMemo } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import toast from "react-hot-toast";
import type { Product } from "@/types";
import { useTranslation } from "@/providers/language/LanguageContext";
import useSWR from "swr";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export const useWishlist = (productId?: string) => {
  const { data: session } = useSession();
  const { t } = useTranslation();

  // Use SWR for wishlist data fetching with optimized settings
  const { data, error, mutate } = useSWR<{ items: Product[] }>(
    session?.user ? "/api/wishlist" : null,
    fetcher,
    {
      revalidateOnFocus: false, // Disable revalidation on focus to prevent unnecessary requests
      revalidateOnReconnect: true,
      dedupingInterval: 1000, // Reduce deduping interval to 1 second
      refreshInterval: 0, // Disable automatic refresh
      focusThrottleInterval: 5000, // Throttle focus events
    }
  );

  // Memoize wishlistItems to prevent unnecessary re-renders
  const wishlistItems = useMemo(() => data?.items || [], [data?.items]);

  // Memoize isInWishlist check to prevent unnecessary recalculations
  const isInWishlist = useMemo(() => {
    if (!productId || !wishlistItems) return false;
    return wishlistItems.some((item) => item._id === productId);
  }, [productId, wishlistItems]);

  const toggleWishlist = async (productId: string) => {
    if (!session?.user) {
      toast.error(t("wishlist.loginRequired"));
      return;
    }

    try {
      // Only update the wishlist using the server response
      const res = await axios.post("/api/wishlist", { productId });
      if (!res.data.success) {
        throw new Error("Failed to update wishlist");
      }
      // Update the cache with the server response
      await mutate(res.data, false);

      // Use the server response to determine the toast message
      if (res.data.action === "removed") {
        toast.success(t("common.removedFromWishlist"));
      } else if (res.data.action === "added") {
        toast.success(t("common.addedToWishlist"));
      } else {
        toast.success(t("common.success"));
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
      toast.error(t("wishlist.updateFailed"));
    }
  };

  return {
    isInWishlist,
    wishlistItems,
    toggleWishlist,
    isLoading: !error && !data,
    isError: error,
  };
};
