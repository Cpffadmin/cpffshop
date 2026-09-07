import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/providers/language/LanguageContext";
import { cachedGet } from "@/utils/services/clientCache";

interface Product {
  id: string;
  displayNames: {
    en: string;
    "zh-TW": string;
    [key: string]: string;
  };
  price: number;
  rating: number;
  image: string;
  link: string;
}

// Mobile shows a 2 x 2 page instead of the desktop carousel.
const MOBILE_PAGE_SIZE = 4;

const BestSellingProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [mobilePage, setMobilePage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const mobileScrollerRef = useRef<HTMLDivElement>(null);
  const { t, language } = useTranslation();

  useEffect(() => {
    const fetchBestSellingProducts = async () => {
      try {
        setIsLoading(true);
        const data = await cachedGet<Product[]>("/api/products/bestselling");
        setProducts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching best-selling products:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBestSellingProducts();
  }, []);

  const nextProduct = () =>
    setCurrentIndex((prevIndex) => (prevIndex + 1) % products.length);
  const prevProduct = () =>
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + products.length) % products.length
    );
  const getProductIndex = (offset: number): number =>
    (currentIndex + offset + products.length) % products.length;

  const mobileTotalPages = Math.max(
    1,
    Math.ceil(products.length / MOBILE_PAGE_SIZE)
  );
  const mobilePageIndex = Math.min(mobilePage, mobileTotalPages - 1);
  const mobilePages = Array.from({ length: mobileTotalPages }, (_, page) =>
    products.slice(page * MOBILE_PAGE_SIZE, (page + 1) * MOBILE_PAGE_SIZE)
  );

  // Arrows and dots drive the same scroller, so swiping and tapping stay in sync.
  const scrollToMobilePage = (page: number) => {
    const scroller = mobileScrollerRef.current;
    const target = Math.min(Math.max(page, 0), mobileTotalPages - 1);
    setMobilePage(target);
    scroller?.scrollTo({
      left: target * scroller.clientWidth,
      behavior: "smooth",
    });
  };

  const handleMobileScroll = () => {
    const scroller = mobileScrollerRef.current;
    if (!scroller || scroller.clientWidth === 0) return;
    const page = Math.round(scroller.scrollLeft / scroller.clientWidth);
    setMobilePage((current) => (current === page ? current : page));
  };

  if (isLoading) {
    return (
      <section className="py-8 md:py-16 app-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-64 h-80 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!isLoading && products.length === 0) {
    return (
      <section className="py-8 md:py-16 app-background">
        <div className="container mx-auto px-4">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-8 md:mb-12 text-foreground">
            {t("common.bestSellingProducts")}
          </h2>
          <div className="text-center text-muted-foreground">
            {t("common.noResults")}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 md:py-16 app-background">
      <div className="container mx-auto px-4">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-center mb-8 md:mb-12 text-foreground">
          {t("common.bestSellingProducts")}
        </h2>
        {/* Mobile: swipe between pages of 4 products, 2 per row */}
        <div className="md:hidden">
          <div
            ref={mobileScrollerRef}
            onScroll={handleMobileScroll}
            className="flex items-start snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {mobilePages.map((page, pageIndex) => (
              <div
                key={pageIndex}
                className="w-full flex-shrink-0 snap-center grid grid-cols-2 content-start gap-3 auto-rows-min"
              >
                {page.map((product, index) => (
                  <Link
                    key={product.id}
                    href={product.link}
                    className="bg-card rounded-[1.25rem] shadow-lg overflow-hidden flex flex-col"
                  >
                    <div className="w-full aspect-square relative overflow-hidden">
                      <Image
                        src={product.image}
                        alt={
                          product.displayNames[language] ||
                          product.displayNames.en
                        }
                        fill
                        sizes="50vw"
                        className="object-cover"
                        priority={pageIndex === 0 && index < 2}
                      />
                    </div>
                    <div className="p-3 bg-card">
                      <h3 className="text-sm font-semibold mb-1 truncate text-foreground">
                        {product.displayNames[language] ||
                          product.displayNames.en}
                      </h3>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-foreground">
                          ${product.price}
                        </span>
                        {typeof product.rating === "number" && (
                          <div className="flex items-center">
                            <Star className="w-3.5 h-3.5 text-primary fill-current" />
                            <span className="ml-1 text-xs text-muted-foreground">
                              {product.rating}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ))}
          </div>
          {mobileTotalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-4">
              <button
                onClick={() => scrollToMobilePage(mobilePageIndex - 1)}
                disabled={mobilePageIndex === 0}
                className="p-2 bg-background/50 rounded-full shadow-lg transition-opacity active:bg-background/80 disabled:opacity-30"
                type="button"
                aria-label={t("common.previous")}
              >
                <ChevronLeft className="w-6 h-6 text-foreground" />
              </button>
              <div className="flex items-center gap-2">
                {mobilePages.map((_, pageIndex) => (
                  <button
                    key={pageIndex}
                    onClick={() => scrollToMobilePage(pageIndex)}
                    type="button"
                    aria-label={t("common.goToPage", {
                      page: pageIndex + 1,
                    })}
                    aria-current={pageIndex === mobilePageIndex}
                    className={`h-2 rounded-full transition-all ${
                      pageIndex === mobilePageIndex
                        ? "w-5 bg-primary"
                        : "w-2 bg-muted-foreground/40"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => scrollToMobilePage(mobilePageIndex + 1)}
                disabled={mobilePageIndex === mobileTotalPages - 1}
                className="p-2 bg-background/50 rounded-full shadow-lg transition-opacity active:bg-background/80 disabled:opacity-30"
                type="button"
                aria-label={t("common.next")}
              >
                <ChevronRight className="w-6 h-6 text-foreground" />
              </button>
            </div>
          )}
        </div>
        {/* Desktop: carousel */}
        <div className="relative hidden md:block">
          <button
            onClick={prevProduct}
            className="absolute left-4 p-1 top-1/2 transform -translate-y-1/2 z-10 bg-background/50 rounded-full shadow-lg hover:bg-background/80 transition-colors"
            type="button"
            aria-label={t("common.previous")}
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-foreground" />
          </button>
          <div
            className="flex items-center h-[27rem] justify-center overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex w-full justify-center">
              {Array.from({ length: products.length }).map((_, offset) => {
                const product = products[getProductIndex(offset)];
                if (!product) return null;
                return (
                  <div
                    key={product.id}
                    className={`transition-all duration-300 flex-shrink-0 w-full md:w-1/3 lg:w-1/5 px-2 ${
                      offset === Math.floor(products.length / 2)
                        ? "scale-105 z-10"
                        : "scale-95 opacity-75"
                    }`}
                  >
                    <Link
                      href={product.link}
                      className="bg-card rounded-[1.5rem] shadow-lg overflow-hidden transform transition-transform duration-300 hover:scale-105 flex flex-col"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="w-full relative overflow-hidden">
                        <Image
                          width={500}
                          height={500}
                          src={product.image}
                          alt={
                            product.displayNames[language] ||
                            product.displayNames.en
                          }
                          className="w-full sm:h-48 md:h-56 lg:h-64 object-cover"
                          priority={offset === Math.floor(products.length / 2)}
                        />
                      </div>
                      <div className="p-4 bg-card">
                        <h3 className="text-lg md:text-xl font-semibold mb-1 truncate text-foreground">
                          {product.displayNames[language] ||
                            product.displayNames.en}
                        </h3>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-foreground">
                            ${product.price}
                          </span>
                          {typeof product.rating === "number" && (
                            <div className="flex items-center">
                              <Star className="w-4 h-4 md:w-5 md:h-5 text-primary fill-current" />
                              <span className="ml-1 text-sm md:text-base text-muted-foreground">
                                {product.rating}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
          <button
            onClick={nextProduct}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-background/50 rounded-full p-1 shadow-lg hover:bg-background/80 transition-colors"
            type="button"
            aria-label={t("common.next")}
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-foreground" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default BestSellingProducts;
