import { useState, useEffect, useCallback } from "react";
import { LayoutGrid, Table } from "lucide-react";
import { Product } from "@/types";
import ProductGrid from "./ProductGrid";
import ProductTable from "./ProductTable";
import { useTranslation } from "@/providers/language/LanguageContext";

interface ProductViewProps {
  products: Product[];
  isLoading?: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const ProductView: React.FC<ProductViewProps> = ({
  products,
  isLoading = false,
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [lastWidth, setLastWidth] = useState(0);
  const { t } = useTranslation();

  const updateViewMode = useCallback(() => {
    const currentWidth = window.innerWidth;
    const widthDiff = Math.abs(currentWidth - lastWidth);

    // Only update if width change is significant (more than 20px)
    // This prevents changes from minor UI shifts like address bar collapse
    if (widthDiff > 20) {
      setLastWidth(currentWidth);
      const isMobile = currentWidth < 640;
      setViewMode(isMobile ? "table" : "grid");
    }
  }, [lastWidth]);

  useEffect(() => {
    // Set initial width
    setLastWidth(window.innerWidth);

    // Debounce the resize handler
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateViewMode, 150);
    };

    window.addEventListener("resize", handleResize);
    updateViewMode(); // Initial check

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [updateViewMode]);

  // If there are no products and we're not loading, show the empty message
  if (!isLoading && products.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[200px] text-muted-foreground">
        {t("categories.emptyCategory")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setViewMode("grid")}
          className={`p-2 rounded-md transition-colors ${
            viewMode === "grid"
              ? "bg-primary text-primary-foreground"
              : "bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <LayoutGrid className="h-5 w-5" />
        </button>
        <button
          onClick={() => setViewMode("table")}
          className={`p-2 rounded-md transition-colors ${
            viewMode === "table"
              ? "bg-primary text-primary-foreground"
              : "bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <Table className="h-5 w-5" />
        </button>
      </div>

      {viewMode === "grid" ? (
        <ProductGrid
          products={products}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      ) : (
        <ProductTable
          products={products}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default ProductView;
