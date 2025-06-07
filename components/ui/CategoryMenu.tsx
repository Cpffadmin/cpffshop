"use client";

import React, { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";
import { useTranslation } from "@/providers/language/LanguageContext";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { usePathname } from "next/navigation";

interface Category {
  _id: string;
  name: string;
  displayNames?: {
    [key: string]: string;
  };
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
  const pathname = usePathname();

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

  // Check if arrows should be shown
  const checkArrows = () => {
    const container = containerRef.current;
    if (!container) return;

    const hasOverflow = container.scrollWidth > container.clientWidth;
    setShowArrows(hasOverflow);
  };

  // Add resize observer to check when container size changes
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const resizeObserver = new ResizeObserver(checkArrows);
      resizeObserver.observe(container);
      return () => resizeObserver.disconnect();
    }
  }, []);

  // Check scrollable when categories change
  useEffect(() => {
    checkArrows();
  }, [categories]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/categories");
        const categories = response.data.categories.map(
          (category: Category) => ({
            _id: category._id,
            name: category.name,
            displayNames: category.displayNames,
          })
        );
        setCategories(categories);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleCategoryClick = (category: string) => {
    onCategorySelect(category);
  };

  return (
    <div
      className={`relative w-full bg-gray-900/20 dark:bg-gray-800/20 py-4 ${
        isMobile ? "block" : "hidden md:block"
      }`}
    >
      {!isMobile && showArrows && (
        <button
          onClick={() => handleScroll("left")}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 rounded-lg p-1.5 h-10 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
      )}

      <div
        ref={containerRef}
        className={`mx-auto max-w-[1200px] px-12 ${
          isMobile
            ? "flex flex-col space-y-2"
            : "flex gap-4 overflow-x-auto hide-scrollbar scroll-smooth"
        }`}
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
                height={isMobile ? "h-12" : "h-14"}
                className="rounded-lg"
              />
            ))}
          </>
        ) : (
          <>
            <button
              onClick={() => handleCategoryClick("All Categories")}
              className={`flex-shrink-0 flex items-center ${
                isMobile ? "justify-start px-4" : "justify-center"
              } ${isMobile ? "w-full h-12" : "w-28 h-14"} ${
                selectedCategory === "All Categories"
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : "bg-white dark:bg-gray-800"
              } rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-2 group`}
            >
              <span
                className={`text-sm ${
                  selectedCategory === "All Categories"
                    ? "text-blue-500 dark:text-blue-400"
                    : "text-gray-700 dark:text-gray-200"
                } group-hover:text-blue-500 dark:group-hover:text-blue-400 text-center transition-colors line-clamp-2`}
              >
                {t("common.allCategories")}
              </span>
            </button>

            {categories.map((category) => {
              if (!category) return null;
              return (
                <button
                  key={category._id}
                  onClick={() => handleCategoryClick(category._id)}
                  className={`flex-shrink-0 flex items-center ${
                    isMobile ? "justify-start px-4" : "justify-center"
                  } ${isMobile ? "w-full h-12" : "w-28 h-14"} ${
                    selectedCategory === category._id
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "bg-white dark:bg-gray-800"
                  } rounded-lg shadow-md hover:shadow-lg transition-all duration-300 p-2 group`}
                >
                  <span
                    className={`text-sm font-medium ${
                      selectedCategory === category._id
                        ? "text-blue-500 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300"
                    } group-hover:text-blue-500 dark:group-hover:text-blue-400 text-center transition-colors line-clamp-2`}
                  >
                    {category.displayNames?.[language] || category.name}
                  </span>
                </button>
              );
            })}
          </>
        )}
      </div>

      {!isMobile && showArrows && (
        <button
          onClick={() => handleScroll("right")}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 rounded-lg p-1.5 h-14 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none"
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
