"use client";

import { useEffect, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/providers/language/LanguageContext";

export const PRODUCT_PAGE_SIZE_OPTIONS = [12, 24, 48, 100] as const;
export const DEFAULT_PRODUCT_PAGE_SIZE = 12;

const PAGE_SIZE_STORAGE_KEY = "products-per-page";

function isValidPageSize(value: number) {
  return (PRODUCT_PAGE_SIZE_OPTIONS as readonly number[]).includes(value);
}

export function parseProductPageSize(value: string | null | undefined) {
  const parsed = parseInt(value || "", 10);
  return isValidPageSize(parsed) ? parsed : DEFAULT_PRODUCT_PAGE_SIZE;
}

// Guests have no account to save to, so the choice lives in the browser.
export function readStoredProductPageSize(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = parseInt(
      window.localStorage.getItem(PAGE_SIZE_STORAGE_KEY) || "",
      10
    );
    return isValidPageSize(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function storeProductPageSize(size: number) {
  if (typeof window === "undefined" || !isValidPageSize(size)) return;
  try {
    window.localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(size));
  } catch {
    // Private mode / storage disabled — the URL still carries the choice.
  }
}

interface ProductPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (size: number) => void;
  infiniteScroll?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  loadedCount?: number;
  totalCount?: number;
}

const pageButtonClass =
  "px-4 py-2 rounded-md border border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

const ProductPagination: React.FC<ProductPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  pageSizeOptions = PRODUCT_PAGE_SIZE_OPTIONS,
  onPageSizeChange,
  infiniteScroll = false,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false,
  loadedCount = 0,
  totalCount = 0,
}) => {
  const { t } = useTranslation();
  const lastPage = Math.max(totalPages, 1);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!infiniteScroll || !hasMore || !onLoadMore || isLoadingMore) {
      return;
    }

    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "240px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [infiniteScroll, hasMore, onLoadMore, isLoadingMore]);

  const pageSizeControl =
    onPageSizeChange && pageSize ? (
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground whitespace-nowrap">
          {t("common.perPage")}
        </label>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => {
            const next = Number(value);
            if (Number.isFinite(next) && next !== pageSize) {
              onPageSizeChange(next);
            }
          }}
        >
          <SelectTrigger className="w-[90px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    ) : null;

  if (infiniteScroll) {
    return (
      <div className="mt-8 flex flex-col items-center gap-3">
        {pageSizeControl}
        {totalCount > 0 ? (
          <span className="text-sm text-muted-foreground">
            {t("common.loadedCount", {
              loaded: loadedCount,
              total: totalCount,
            })}
          </span>
        ) : null}
        {hasMore ? (
          <>
            <div ref={sentinelRef} className="h-4 w-full" aria-hidden="true" />
            <button
              type="button"
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className={pageButtonClass}
            >
              {isLoadingMore ? t("common.loading") : t("common.loadMore")}
            </button>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
      {pageSizeControl}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className={pageButtonClass}
        >
          {t("common.previous")}
        </button>
        <span className="text-sm text-muted-foreground">
          {t("common.pagination", {
            current: currentPage,
            total: lastPage,
          })}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(currentPage + 1, lastPage))}
          disabled={currentPage === lastPage}
          className={pageButtonClass}
        >
          {t("common.next")}
        </button>
      </div>
    </div>
  );
};

export default ProductPagination;
