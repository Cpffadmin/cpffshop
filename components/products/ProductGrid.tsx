import { Product } from "@/types";
import ProductCard from "./ProductCard";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import ProductPagination from "./ProductPagination";

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  infiniteScroll?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  totalCount?: number;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  infiniteScroll,
  hasMore,
  onLoadMore,
  isLoadingMore,
  totalCount,
}) => {
  if (isLoading && products.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <LoadingSkeleton key={i} height="h-80" className="rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 transition-opacity duration-300 ${
          isLoading ? "opacity-50" : "opacity-100"
        }`}
      >
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>

      <ProductPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        pageSize={pageSize}
        onPageSizeChange={onPageSizeChange}
        infiniteScroll={infiniteScroll}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        isLoadingMore={isLoadingMore}
        loadedCount={products.length}
        totalCount={totalCount}
      />
    </div>
  );
};

export default ProductGrid;
