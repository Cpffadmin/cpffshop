import { useState, useEffect, useCallback, ReactNode } from "react";
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
  toolbarStart?: ReactNode;
}

const ProductView: React.FC<ProductViewProps> = ({
  products,
  isLoading = false,
  currentPage,
  totalPages,
  onPageChange,
  toolbarStart,
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

  const viewToggleClass = (active: boolean) =>
    `h-10 w-10 flex items-center justify-center rounded-md transition-colors ${
      active
        ? "bg-primary text-primary-foreground"
        : "bg-card text-foreground border border-border hover:bg-accent hover:text-accent-foreground"
    }`;

  const toolbar = (
    <div className="sticky top-14 z-20 -mx-4 px-4 py-1 app-background overflow-visible md:top-[var(--navbar-height)] md:mx-0 md:px-0">
      <div className="flex items-start gap-2 md:flex-col md:items-stretch md:gap-3">
        {toolbarStart ? (
          <div className="min-w-0 flex-1 md:w-full">{toolbarStart}</div>
        ) : null}
        <div
          className={`flex shrink-0 gap-2 ${
            toolbarStart ? "" : "ml-auto"
          } md:self-end`}
        >
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={viewToggleClass(viewMode === "grid")}
            aria-pressed={viewMode === "grid"}
          >
            <LayoutGrid className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={viewToggleClass(viewMode === "table")}
            aria-pressed={viewMode === "table"}
          >
            <Table className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );

  if (!isLoading && products.length === 0) {
    return (
      <div className="space-y-6">
        {toolbar}
        <div className="flex justify-center items-center min-h-[200px] text-muted-foreground">
          {t("categories.common.emptyCategory")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toolbar}

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
