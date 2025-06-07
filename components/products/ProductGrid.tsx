import { Product } from "@/types";
import ProductCard from "./ProductCard";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  currentPage,
  totalPages,
  onPageChange,
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

      {/* Pagination - Show regardless of number of pages */}
      <div className="flex justify-center items-center gap-4 mt-8">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-md border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {Math.max(totalPages, 1)}
        </span>
        <button
          onClick={() =>
            onPageChange(Math.min(currentPage + 1, Math.max(totalPages, 1)))
          }
          disabled={currentPage === Math.max(totalPages, 1)}
          className="px-4 py-2 rounded-md border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ProductGrid;
