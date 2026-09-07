import { useState, useEffect, useRef, ReactNode } from "react";
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
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  infiniteScroll?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  totalCount?: number;
}

const ProductView: React.FC<ProductViewProps> = ({
  products,
  isLoading = false,
  currentPage,
  totalPages,
  onPageChange,
  toolbarStart,
  pageSize,
  onPageSizeChange,
  infiniteScroll,
  hasMore,
  onLoadMore,
  isLoadingMore,
  totalCount,
}) => {
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const lastWidthRef = useRef(0);
  const { t } = useTranslation();

  useEffect(() => {
    const applyViewMode = (force = false) => {
      const width = window.innerWidth;
      if (!force && Math.abs(width - lastWidthRef.current) <= 20) {
        return;
      }
      lastWidthRef.current = width;
      const nextMode = width < 640 ? "table" : "grid";
      setViewMode((current) => (current === nextMode ? current : nextMode));
    };

    applyViewMode(true);

    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => applyViewMode(false), 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

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
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
          infiniteScroll={infiniteScroll}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          isLoadingMore={isLoadingMore}
          totalCount={totalCount}
        />
      ) : (
        <ProductTable
          products={products}
          isLoading={isLoading}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          pageSize={pageSize}
          onPageSizeChange={onPageSizeChange}
          infiniteScroll={infiniteScroll}
          hasMore={hasMore}
          onLoadMore={onLoadMore}
          isLoadingMore={isLoadingMore}
          totalCount={totalCount}
        />
      )}
    </div>
  );
};

export default ProductView;
