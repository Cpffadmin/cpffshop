"use client";

import React, { useRef, useEffect, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cachedGet } from "@/utils/services/clientCache";
import { useTranslation } from "@/providers/language/LanguageContext";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { cn } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
  displayNames?: {
    [key: string]: string;
  };
  descriptions?: {
    [key: string]: string;
  };
  order?: number;
  isActive?: boolean;
}

interface CategoryMenuProps {
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
  isMobile?: boolean;
}

const CategoryMenu: React.FC<CategoryMenuProps> = ({
  selectedCategory,
  onCategorySelect,
  isMobile = false,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { language, t } = useTranslation();

  const updateScrollButtons = () => {
    const container = containerRef.current;
    if (!container) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollLeft(scrollLeft > 1);
    setCanScrollRight(maxScroll - scrollLeft > 1);
  };

  const handleScroll = (direction: "left" | "right") => {
    const container = containerRef.current;
    if (!container) return;

    const scrollAmount = 200;
    const targetScroll =
      direction === "left"
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await cachedGet<Category[]>("/api/categories");
        const categories = data.map((category: Category) => ({
          _id: category._id,
          name: category.name,
          displayNames: category.displayNames,
          descriptions: category.descriptions,
          order: category.order,
          isActive: category.isActive,
        }));
        setCategories(categories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    updateScrollButtons();
    const resizeObserver = new ResizeObserver(updateScrollButtons);
    resizeObserver.observe(container);
    container.addEventListener("scroll", updateScrollButtons, { passive: true });

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener("scroll", updateScrollButtons);
    };
  }, [categories, loading]);

  const categoryLabel = (category: Category) =>
    category.displayNames?.[language] || category.name;

  const selectedCategoryRecord = categories.find(
    (category) => category._id === selectedCategory
  );
  const selectedLabel =
    selectedCategory === "All Categories"
      ? t("common.allCategories")
      : selectedCategoryRecord
        ? categoryLabel(selectedCategoryRecord)
        : t("product.filters.categories");

  const handleCategoryClick = (category: string) => {
    onCategorySelect(category);
    setIsExpanded(false);
  };

  const listItemClass = (active: boolean) =>
    cn(
      "flex w-full items-center justify-start rounded-lg px-3 py-3 text-left text-sm font-medium transition-colors",
      active
        ? "bg-primary text-primary-foreground"
        : "bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
    );

  const chipClass = (active: boolean) =>
    cn(
      "flex-shrink-0 flex items-center justify-center rounded-lg transition-colors px-3 h-14 w-28 p-2",
      active
        ? "bg-primary text-primary-foreground"
        : "bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
    );

  const categoryButtons = (
    <>
      <button
        type="button"
        onClick={() => handleCategoryClick("All Categories")}
        className={
          isMobile
            ? listItemClass(selectedCategory === "All Categories")
            : chipClass(selectedCategory === "All Categories")
        }
      >
        <span
          className={
            isMobile ? "line-clamp-2 w-full text-left" : "line-clamp-2 text-center"
          }
        >
          {t("common.allCategories")}
        </span>
      </button>
      {categories.map((category) => {
        if (!category) return null;
        const active = selectedCategory === category._id;
        return (
          <button
            type="button"
            key={category._id}
            onClick={() => handleCategoryClick(category._id)}
            className={isMobile ? listItemClass(active) : chipClass(active)}
          >
            <span
              className={
                isMobile
                  ? "line-clamp-2 w-full text-left"
                  : "line-clamp-2 text-center"
              }
            >
              {categoryLabel(category)}
            </span>
          </button>
        );
      })}
    </>
  );

  const overlayItemClass = (active: boolean) =>
    cn(
      "flex min-h-10 items-center justify-center rounded-md px-1 py-2 text-center text-xs font-medium leading-tight",
      active
        ? "bg-primary text-primary-foreground"
        : "text-foreground hover:bg-accent/70"
    );

  const overlayGrid = (
    <div className="grid grid-cols-3 gap-1">
      <button
        type="button"
        onClick={() => handleCategoryClick("All Categories")}
        className={overlayItemClass(selectedCategory === "All Categories")}
      >
        <span className="line-clamp-2">{t("common.allCategories")}</span>
      </button>
      {categories.map((category) => {
        if (!category) return null;
        const active = selectedCategory === category._id;
        return (
          <button
            type="button"
            key={category._id}
            onClick={() => handleCategoryClick(category._id)}
            className={overlayItemClass(active)}
          >
            <span className="line-clamp-2">{categoryLabel(category)}</span>
          </button>
        );
      })}
    </div>
  );

  if (isMobile) {
    return (
      <div className="relative w-full py-2">
        {loading ? (
          <div className="flex flex-col space-y-2 px-4">
            {[...Array(6)].map((_, i) => (
              <LoadingSkeleton key={i} width="w-full" height="h-12" className="rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-1 px-4">{categoryButtons}</div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full md:relative">
      <div className="md:hidden">
        {loading ? (
          <LoadingSkeleton width="w-full" height="h-10" className="rounded-lg" />
        ) : (
          <>
            {isExpanded && (
              <button
                type="button"
                className="fixed inset-0 z-20 cursor-default"
                aria-label={t("common.close")}
                onClick={() => setIsExpanded(false)}
              />
            )}
            <button
              type="button"
              onClick={() => setIsExpanded((open) => !open)}
              className="relative z-30 flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 text-left"
              aria-expanded={isExpanded}
              aria-label={t("product.filters.categories")}
            >
              <span className="min-w-0 truncate text-sm font-medium text-foreground">
                {selectedLabel}
              </span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            </button>
            {isExpanded && (
              <div
                className="absolute left-0 right-0 top-full z-30 mt-1 rounded-lg border border-border p-2 shadow-lg"
                style={{
                  backgroundColor:
                    "hsl(var(--navbar-background, 0 0% 100%) / 0.8)",
                }}
              >
                {overlayGrid}
              </div>
            )}
          </>
        )}
      </div>

      <div className="mx-auto hidden max-w-[1200px] items-center gap-2 md:flex">
        {(canScrollLeft || canScrollRight) && (
          <button
            type="button"
            onClick={() => handleScroll("left")}
            className="flex h-14 w-10 shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-md transition-colors hover:bg-gray-100 focus:outline-none dark:bg-gray-800/80 dark:hover:bg-gray-700"
            aria-label={t("common.previous")}
          >
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        )}

        <div
          ref={containerRef}
          className="flex min-w-0 flex-1 gap-4 overflow-x-auto scroll-smooth hide-scrollbar"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {loading ? (
            [...Array(6)].map((_, i) => (
              <LoadingSkeleton
                key={i}
                width="w-28"
                height="h-14"
                className="flex-shrink-0 rounded-lg"
              />
            ))
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleCategoryClick("All Categories")}
                className={chipClass(selectedCategory === "All Categories")}
              >
                <span className="line-clamp-2 text-center text-sm font-medium">
                  {t("common.allCategories")}
                </span>
              </button>
              {categories.map((category) => {
                if (!category) return null;
                const active = selectedCategory === category._id;
                return (
                  <button
                    type="button"
                    key={category._id}
                    onClick={() => handleCategoryClick(category._id)}
                    className={chipClass(active)}
                  >
                    <span className="line-clamp-2 text-center text-sm font-medium">
                      {categoryLabel(category)}
                    </span>
                  </button>
                );
              })}
            </>
          )}
        </div>

        {(canScrollLeft || canScrollRight) && (
          <button
            type="button"
            onClick={() => handleScroll("right")}
            className="flex h-14 w-10 shrink-0 items-center justify-center rounded-lg bg-white/80 shadow-md transition-colors hover:bg-gray-100 focus:outline-none dark:bg-gray-800/80 dark:hover:bg-gray-700"
            aria-label={t("common.next")}
          >
            <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        )}
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default CategoryMenu;
