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
  const [showArrows, setShowArrows] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { language, t } = useTranslation();

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

  const checkArrows = () => {
    const container = containerRef.current;
    if (!container) return;

    const hasOverflow = container.scrollWidth > container.clientWidth;
    setShowArrows(hasOverflow);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const resizeObserver = new ResizeObserver(checkArrows);
      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    }
  }, []);

  useEffect(() => {
    checkArrows();
  }, [categories]);

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

  const collapsibleList = (
    <div className="mt-2 flex max-h-[50vh] flex-col gap-1 overflow-y-auto">
      <button
        type="button"
        onClick={() => handleCategoryClick("All Categories")}
        className={listItemClass(selectedCategory === "All Categories")}
      >
        <span className="line-clamp-2 w-full text-left">
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
            className={listItemClass(active)}
          >
            <span className="line-clamp-2 w-full text-left">
              {categoryLabel(category)}
            </span>
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
    <div className="relative w-full">
      <div className="md:hidden">
        {loading ? (
          <LoadingSkeleton width="w-full" height="h-10" className="rounded-lg" />
        ) : (
          <>
            <button
              type="button"
              onClick={() => setIsExpanded((open) => !open)}
              className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 text-left"
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
            {isExpanded && collapsibleList}
          </>
        )}
      </div>

      <div className="hidden md:block">
        {showArrows && (
          <button
            type="button"
            onClick={() => handleScroll("left")}
            className="absolute left-4 top-1/2 z-10 hidden h-10 -translate-y-1/2 items-center rounded-lg bg-white/80 p-1.5 shadow-md transition-colors hover:bg-gray-100 focus:outline-none dark:bg-gray-800/80 dark:hover:bg-gray-700 md:flex"
            aria-label={t("common.previous")}
          >
            <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        )}

        <div
          ref={containerRef}
          className="mx-auto flex max-w-[1200px] gap-4 overflow-x-auto scroll-smooth px-12 hide-scrollbar"
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

        {showArrows && (
          <button
            type="button"
            onClick={() => handleScroll("right")}
            className="absolute right-4 top-1/2 z-10 hidden h-14 -translate-y-1/2 items-center rounded-lg bg-white/80 p-1.5 shadow-md transition-colors hover:bg-gray-100 focus:outline-none dark:bg-gray-800/80 dark:hover:bg-gray-700 md:flex"
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
