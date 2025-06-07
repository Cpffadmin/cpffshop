"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import type { CartItem, Product } from "@/types";
import ProductView from "@/components/products/ProductView";
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
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[...Array(12)].map((_, index) => (
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

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 12;

  // Get URL params
  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const urlSort = searchParams.get("sort");
  const urlCategory = searchParams.get("category") || "All Categories";
  const urlMinPrice = parseFloat(searchParams.get("minPrice") || "0");
  const urlMaxPrice = parseFloat(searchParams.get("maxPrice") || "1000000");
  const urlPage = parseInt(searchParams.get("page") || "1");

  // Filter states with URL persistence
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState("All Brands");
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [sortOption, setSortOption] = useState<string>("newest");
  const [priceRange, setPriceRange] = useState({
    min: urlMinPrice,
    max: urlMaxPrice,
  });

  // Initialize states from URL params if they exist
  useEffect(() => {
    if (urlSort) {
      setSortOption(urlSort);
    }
  }, [urlSort]);

  // Update URL when filters change
  useEffect(() => {
    // Don't update URL if we're using default values
    if (
      selectedBrand === "All Brands" &&
      selectedCategory === "All Categories" &&
      sortOption === "newest" &&
      priceRange.min === 0 &&
      priceRange.max === 1000000 &&
      currentPage === 1
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

    if (currentPage > 1) {
      params.set("page", currentPage.toString());
    }

    const queryString = params.toString();
    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;
    window.history.replaceState({}, "", newUrl);
  }, [selectedBrand, selectedCategory, sortOption, priceRange, currentPage]);

  // Initialize page from URL
  useEffect(() => {
    setCurrentPage(urlPage);
  }, [urlPage]);

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
    if (data) {
      setProducts(data.products);
      setTotalPages(Math.ceil(data.total / itemsPerPage));
    }
  }, [data]);

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

        setProducts((prevProducts) =>
          prevProducts.map((product) => {
            if (product._id === productId) {
              return { ...product, featured: updatedProduct.featured };
            }
            if (updatedProduct.featured) {
              return { ...product, featured: false };
            }
            return product;
          })
        );

        toast.success(
          updatedProduct.featured
            ? "Product set as featured"
            : "Product removed from featured"
        );
      } catch (error) {
        console.error("Error toggling feature status:", error);
        toast.error("Failed to update feature status");
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
  }, [session, router, addItem, toggleWishlist]);

  const [categories, setCategories] = useState<
    { value: string; label: string }[]
  >([]);

  const handleProductsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedCategory("All Categories");
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
        const categoryNames = response.data.categories.map((cat: Category) => ({
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

  if (isLoading && !data) return <ProductGridSkeleton />;
  if (error) {
    toast.error(t("product.fetchError"));
    return <div>Error loading products</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb items={breadcrumbItems} />
        <CategoryMenu
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />
        <div className="mt-8">
          <ProductView
            products={products}
            isLoading={isValidating}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
