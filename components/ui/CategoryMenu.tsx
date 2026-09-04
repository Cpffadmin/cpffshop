"use client";

import React, { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

  const handleCategoryClick = (category: string) => {
    onCategorySelect(category);
  };

  const chipClass = (active: boolean) =>
    cn(
      "flex-shrink-0 snap-start flex items-center justify-center rounded-lg transition-colors px-3 h-10 md:w-28 md:h-14 md:p-2",
      active
        ? "bg-primary text-primary-foreground"
        : "bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
    );

  const chipLabelClass = (active: boolean) =>
    cn(
      "text-sm font-medium line-clamp-2 whitespace-nowrap md:whitespace-normal",
      active ? "text-primary-foreground" : ""
    );

  return (
    <div className="relative w-full py-2 md:py-4">
      {!isMobile && showArrows && (
        <button
          type="button"
          onClick={() => handleScroll("left")}
          className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 rounded-lg p-1.5 h-10 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none items-center"
          aria-label={t("common.previous")}
        >
          <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
      )}

      <div
        ref={containerRef}
        className={
          !isMobile
            ? "mx-auto max-w-[1200px] px-0 md:px-12 flex gap-2 md:gap-4 overflow-x-auto hide-scrollbar scroll-smooth snap-x"
            : "mx-auto max-w-[1200px] px-4 flex flex-col space-y-4"
        }
        style={
          !isMobile
            ? { scrollbarWidth: "none", msOverflowStyle: "none" }
            : undefined
        }
      >
        {loading ? (
          <>
            {[...Array(6)].map((_, i) => (
              <LoadingSkeleton
                key={i}
                width={isMobile ? "w-full" : "w-28"}
                height={isMobile ? "h-12" : "h-10 md:h-14"}
                className="rounded-lg flex-shrink-0"
              />
            ))}
          </>
        ) : !isMobile ? (
          <>
            <button
              type="button"
              onClick={() => handleCategoryClick("All Categories")}
              className={chipClass(selectedCategory === "All Categories")}
            >
              <span className={chipLabelClass(selectedCategory === "All Categories")}>
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
                  <span className={chipLabelClass(active)}>
                    {category.displayNames?.[language] || category.name}
                  </span>
                </button>
              );
            })}
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => handleCategoryClick("All Categories")}
              className={cn(
                "flex-shrink-0 flex items-center justify-start px-4 w-full h-12 mb-2 rounded-lg transition-colors",
                selectedCategory === "All Categories"
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              )}
            >
              <span className="text-sm font-medium line-clamp-2 text-left w-full">
                {t("common.allCategories")}
              </span>
            </button>

            <div
              className={
                categories.length > 8
                  ? "grid grid-cols-2 gap-2"
                  : "flex flex-col space-y-2"
              }
            >
              {categories.map((category) => {
                if (!category) return null;
                const active = selectedCategory === category._id;
                return (
                  <button
                    type="button"
                    key={category._id}
                    onClick={() => handleCategoryClick(category._id)}
                    className={cn(
                      "flex-shrink-0 flex items-center justify-start px-4 w-full h-12 rounded-lg transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-accent"
                    )}
                  >
                    <span className="text-sm font-medium line-clamp-2 text-left w-full">
                      {category.displayNames?.[language] || category.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {!isMobile && showArrows && (
        <button
          type="button"
          onClick={() => handleScroll("right")}
          className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 rounded-lg p-1.5 h-14 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none items-center"
          aria-label={t("common.next")}
        >
          <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
      )}

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default CategoryMenu;
