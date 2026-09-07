import axios from "axios";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import useSWR from "swr";

interface MultiLangString {
  en: string;
  "zh-TW": string;
}

interface WishlistItem {
  _id: string;
  name: string;
  displayNames: MultiLangString;
  images: string[];
  price: number;
}

const WISHLIST_KEY = "/api/wishlist";

const fetchWishlist = async (url: string): Promise<WishlistItem[]> => {
  const response = await axios.get(url);
  if (!response.data.success) {
    throw new Error(response.data.error || "Failed to fetch wishlist");
  }
  return response.data.wishlist;
};

/**
 * Shared wishlist state. Every `WishlistButton` calls this hook, and product
 * grids render one button per product, so the previous version — local state
 * plus its own `useEffect` fetch — issued one identical request per card (~100
 * on a full product page). SWR keys them all to one cache entry, so it is a
 * single request, and a toggle in one button updates every other button.
 */
export function useWishlist() {
  const { data: session } = useSession();

  const { data, error, isLoading, mutate } = useSWR<WishlistItem[]>(
    session ? WISHLIST_KEY : null,
    fetchWishlist,
    {
      revalidateOnFocus: false,
      // A fixed toast id collapses the one-per-subscriber error into one toast.
      onError: () =>
        toast.error("Failed to fetch wishlist", { id: "wishlist-error" }),
    }
  );

  const wishlist = data ?? [];

  const toggleWishlist = async (productId: string) => {
    if (!session) {
      toast.error("Please log in to manage your wishlist");
      return;
    }

    try {
      const response = await axios.post(WISHLIST_KEY, { productId });
      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to update wishlist");
      }

      // The route returns the new list, so write it to the shared cache instead
      // of re-fetching.
      await mutate(response.data.wishlist, { revalidate: false });

      toast.success(
        response.data.action === "removed"
          ? "Removed from wishlist"
          : "Added to wishlist"
      );
    } catch (err) {
      console.error("Error updating wishlist:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update wishlist"
      );
    }
  };

  const isInWishlist = (productId: string) =>
    wishlist.some((item) => item._id === productId);

  return {
    wishlist,
    loading: isLoading,
    error: error instanceof Error ? error.message : null,
    toggleWishlist,
    isInWishlist,
    refreshWishlist: () => mutate(),
  };
}
