"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import type { CartItem, Product } from "@/types";
import ProductView from "@/components/products/ProductView";
import {
  DEFAULT_PRODUCT_PAGE_SIZE,
  parseProductPageSize,
  readStoredProductPageSize,
  storeProductPageSize,
} from "@/components/products/ProductPagination";
import useCartStore from "@/store/cartStore";
import CategoryMenu from "@/components/ui/CategoryMenu";
import { useTranslation } from "@/providers/language/LanguageContext";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import useSWR from "swr";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { useCart } from "@/providers/cart/CartContext";
import SortDropdown from "@/components/ui/SortDropdown";

// Filter options for products
const SORT_OPTIONS = [
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
];

interface Category {
  _id: string;
  name: string;
  displayNames: Record<string, string>;
}

interface Brand {
  _id: string;
  name: string;
  displayNames: Record<string, string>;
}

// Add this component before the Products component
const ProductGridSkeleton = () => {
  const isMobile = useIsMobile();
  const skeletonCount = isMobile ? 6 : 12;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[...Array(skeletonCount)].map((_, index) => (
        <div key={index} className="space-y-3">
          <LoadingSkeleton height="h-48" rounded />
          <LoadingSkeleton width="w-3/4" />
          <LoadingSkeleton width="w-1/2" />
        </div>
      ))}
    </div>
  );
};

export default function Products() {
  // Add translation hook at the top with other hooks
  const { t, language } = useTranslation();

  // Core states
  const [products, setProducts] = useState<Product[]>([]);
  const { wishlistItems, toggleWishlist } = useWishlist();

  // Import mobile hook
  const isMobile = useIsMobile();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Get URL params
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const urlSort = searchParams.get("sort");
  const urlCategory = searchParams.get("category") || "All Categories";
  const urlMinPrice = parseFloat(searchParams.get("minPrice") || "0");
  const urlMaxPrice = parseFloat(searchParams.get("maxPrice") || "1000000");
  const urlLimit = parseProductPageSize(searchParams.get("limit"));
  const [itemsPerPage, setItemsPerPage] = useState(urlLimit);

  // Filter states with URL persistence
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("All Brands");
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [sortOption, setSortOption] = useState<string>("newest");
  const [priceRange, setPriceRange] = useState({
    min: urlMinPrice,
    max: urlMaxPrice,
  });

  const skipFilterPageReset = useRef(true);

  useEffect(() => {
    const currentParams = new URLSearchParams(window.location.search);
    const page = Math.max(
      1,
      parseInt(currentParams.get("page") || "1", 10) || 1
    );
    if (page > 1) {
      setCurrentPage(page);
    }

    if (!currentParams.get("limit")) {
      const stored = readStoredProductPageSize();
      if (stored) {
        setItemsPerPage(stored);
      }
    }
  }, []);

  // Initialize states from URL params if they exist
  useEffect(() => {
    if (urlSort) {
      setSortOption(urlSort);
    }
  }, [urlSort]);

  useEffect(() => {
    if (skipFilterPageReset.current) {
      skipFilterPageReset.current = false;
      return;
    }
    setCurrentPage(1);
  }, [selectedCategory, selectedBrand, sortOption]);

  const handlePageSizeChange = useCallback((size: number) => {
    storeProductPageSize(size);
    setItemsPerPage((current) => (current === size ? current : size));
    setCurrentPage(1);
  }, []);

  // Update URL when filters change
  useEffect(() => {
    // Don't update URL if we're using default values
    if (
      selectedBrand === "All Brands" &&
      selectedCategory === "All Categories" &&
      sortOption === "newest" &&
      priceRange.min === 0 &&
      priceRange.max === 1000000 &&
      currentPage === 1 &&
      itemsPerPage === DEFAULT_PRODUCT_PAGE_SIZE
    ) {
      // Clear URL if it has any params
      if (window.location.search) {
        window.history.replaceState({}, "", window.location.pathname);
      }
      return;
    }

    const params = new URLSearchParams();

    if (selectedBrand !== "All Brands") {
      params.set("brand", selectedBrand);
    }

    if (selectedCategory !== "All Categories") {
      params.set("category", selectedCategory);
    }

    if (sortOption !== "newest") {
      params.set("sort", sortOption);
    }

    if (priceRange.min > 0) {
      params.set("minPrice", priceRange.min.toString());
    }
    if (priceRange.max < 1000000) {
      params.set("maxPrice", priceRange.max.toString());
    }

    if (currentPage > 1 && !isMobile) {
      params.set("page", currentPage.toString());
    }

    if (itemsPerPage !== DEFAULT_PRODUCT_PAGE_SIZE) {
      params.set("limit", itemsPerPage.toString());
    }

    const queryString = params.toString();
    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }, [selectedBrand, selectedCategory, sortOption, priceRange, currentPage, itemsPerPage, isMobile]);

  // Hooks
  const { addItem } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  // Fetch products with filters
  const params = new URLSearchParams();
  if (selectedBrand !== "All Brands") {
    params.append("brand", selectedBrand);
  }
  if (selectedCategory && selectedCategory !== "All Categories") {
    params.append("category", selectedCategory);
  }
  if (sortOption) {
    params.append("sort", sortOption);
  }
  if (priceRange.min > 0) {
    params.append("minPrice", priceRange.min.toString());
  }
  if (priceRange.max < 1000000) {
    params.append("maxPrice", priceRange.max.toString());
  }
  params.append("page", currentPage.toString());
  params.append("limit", itemsPerPage.toString());
  const apiUrl = `/api/products?${params.toString()}`;
  const fetcher = (url: string) => axios.get(url).then((res) => res.data);
  const { data, error, isLoading, isValidating } = useSWR(apiUrl, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: true,
    revalidateOnMount: true,
    dedupingInterval: 1000,
  });

  useEffect(() => {
    if (!data) return;
    if (typeof data.page === "number" && data.page !== currentPage) {
      return;
    }

    const nextTotalPages = Math.max(
      1,
      Math.ceil((Number(data.total) || 0) / itemsPerPage) || 1
    );
    setTotalCount((current) =>
      current === data.total ? current : data.total
    );
    setTotalPages((current) =>
      current === nextTotalPages ? current : nextTotalPages
    );

    if (isMobile) {
      setProducts((prev) => {
        if (currentPage <= 1) {
          return data.products;
        }
        const seen = new Set(prev.map((product) => product._id));
        return [
          ...prev,
          ...data.products.filter((product: Product) => !seen.has(product._id)),
        ];
      });
      return;
    }

    setProducts(data.products);
  }, [data, isMobile, itemsPerPage, currentPage]);

  const handleLoadMore = useCallback(() => {
    if (!isMobile || isValidating) return;
    setCurrentPage((page) => (page < totalPages ? page + 1 : page));
  }, [isMobile, isValidating, totalPages]);

  // Cart functionality
  useEffect(() => {
    const handleAddToCart = (e: Event) => {
      const product = (e as CustomEvent<Product>).detail;
      addItem(product);
    };

    const handleToggleWishlist = async (e: Event) => {
      if (!session) {
        router.push("/login");
        return;
      }

      const productId = (e as CustomEvent<string>).detail;
      await toggleWishlist(productId);
    };

    const handleFeatureToggle = async (e: Event) => {
      const productId = (e as CustomEvent<string>).detail;
      try {
        const response = await axios.put(`/api/product/featured/${productId}`);
        const updatedProduct = response.data;

        // Force a fresh fetch of products by adding skipCache parameter
        const params = new URLSearchParams(window.location.search);
        params.set("skipCache", "true");
        const apiUrl = `/api/products?${params.toString()}`;
        const freshData = await axios.get(apiUrl);

        // Update products with fresh data
        setProducts(freshData.data.products);

        // Show success message using the new translation keys
        toast.success(
          updatedProduct.featured
            ? t("product.setAsFeatured")
            : t("product.removedFromFeatured")
        );

        // Refresh the featured products section if it exists
        const event = new CustomEvent("featuredProducts:refresh");
        window.dispatchEvent(event);
      } catch (error) {
        console.error("Error toggling featured status:", error);
        toast.error(t("product.featureUpdateFailed"));
      }
    };

    window.addEventListener("product:addToCart", handleAddToCart);
    window.addEventListener("product:toggleWishlist", handleToggleWishlist);
    window.addEventListener("product:toggleFeature", handleFeatureToggle);

    return () => {
      window.removeEventListener("product:addToCart", handleAddToCart);
      window.removeEventListener(
        "product:toggleWishlist",
        handleToggleWishlist
      );
      window.removeEventListener("product:toggleFeature", handleFeatureToggle);
    };
  }, [session, router, addItem, toggleWishlist, t]);

  const [categories, setCategories] = useState<
    { value: string; label: string }[]
  >([]);

  const handleProductsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedCategory("All Categories");
    setCurrentPage(1); // Reset page when changing category
    router.push("/products");
  };

  const breadcrumbItems = [
    {
      label: t("navigation.products"),
      href: "/products",
      icon: ShoppingBag,
      current: !selectedCategory || selectedCategory === "All Categories",
      onClick: handleProductsClick,
    },
    ...(selectedCategory && selectedCategory !== "All Categories"
      ? [
          {
            label:
              categories.find((cat) => cat.value === selectedCategory)?.label ||
              selectedCategory,
            href: `/products?category=${selectedCategory}`,
            icon: ShoppingBag,
            current: true,
          },
        ]
      : []),
  ];

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("/api/categories");
        const categoryNames = response.data.map((cat: Category) => ({
          value: cat._id,
          label: cat.displayNames?.[language] || cat.name,
        }));
        setCategories(categoryNames);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, [language]);

  // Add useEffect to fetch brands
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await axios.get("/api/brands");
        setBrands(response.data.brands || []);
      } catch (error) {
        console.error("Error fetching brands:", error);
        toast.error(t("brands.fetchError"));
      }
    };

    fetchBrands();
  }, [t]);

  useEffect(() => {
    if (error) {
      toast.error(t("product.fetchError"));
    }
  }, [error, t]);

  if (isLoading && !data) return <ProductGridSkeleton />;
  if (error) {
    return <div>Error loading products</div>;
  }

  return (
    <div className="min-h-screen app-background">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={breadcrumbItems} />
        <div className="mt-4">
          <ProductView
            products={products}
            isLoading={isValidating && products.length === 0}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={itemsPerPage}
            onPageSizeChange={handlePageSizeChange}
            infiniteScroll={isMobile}
            hasMore={isMobile && currentPage < totalPages}
            onLoadMore={handleLoadMore}
            isLoadingMore={isMobile && isValidating && currentPage > 1}
            totalCount={totalCount}
            toolbarStart={
              <CategoryMenu
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
              />
            }
          />
        </div>
      </div>
    </div>
  );
}
