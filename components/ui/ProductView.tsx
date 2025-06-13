import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";

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
  const timeoutRef = useRef<NodeJS.Timeout>();

  const updateViewMode = useCallback(() => {
    const currentWidth = window.innerWidth;
    const widthDiff = Math.abs(currentWidth - lastWidth);

    // Only update if width change is significant (more than 20px)
    if (widthDiff > 20) {
      setLastWidth(currentWidth);
      const isMobile = currentWidth < 640;
      setViewMode(isMobile ? "table" : "grid");
    }
  }, [lastWidth]);

  // Memoize the resize handler
  const handleResize = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(updateViewMode, 150);
  }, [updateViewMode]);

  useEffect(() => {
    // Set initial width
    setLastWidth(window.innerWidth);

    window.addEventListener("resize", handleResize);
    updateViewMode(); // Initial check

    return () => {
      window.removeEventListener("resize", handleResize);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [handleResize, updateViewMode]);

  // Memoize empty state check
  const isEmpty = useMemo(
    () => !isLoading && products.length === 0,
    [isLoading, products.length]
  );

  if (isEmpty) {
    return (
      <div className="flex justify-center items-center min-h-[200px] text-muted-foreground">
        {t("categories.emptyCategory")}
      </div>
    );
  }

  // ... rest of the component code ...
};

export default React.memo(ProductView);
