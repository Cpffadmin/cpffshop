import React from "react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";
import { Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FiSearch } from "react-icons/fi";
import type { Brand } from "@/types";
import { useTranslation } from "@/providers/language/LanguageContext";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

interface SearchDrawerProps {
  searchOpen: boolean;
  setSearchOpen: (value: boolean) => void;
  searchTerm: { search: string };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearchClose: () => void;
  firstTwelveItems: Array<{
    _id: string;
    name: string;
    price: number;
    images: string[];
    averageRating: number;
    numReviews: number;
    originalPrice: number;
    brand?: Brand;
    movement?: string;
    casematerial?: string;
    glass?: string;
  }>;
  resultArr: Array<{
    _id: string;
    name: string;
    price: number;
    images: string[];
  }>;
  isSearching?: boolean;
  error?: string | null;
  isLoading?: boolean;
}

const SearchDrawer = ({
  searchOpen,
  setSearchOpen,
  searchTerm,
  handleChange,
  handleSearchClose,
  firstTwelveItems,
  resultArr,
  isSearching,
  error,
  isLoading,
}: SearchDrawerProps) => {
  const { t } = useTranslation();

  const handleIconClick = () => {
    setSearchOpen(true);
  };

  return (
    <>
      <div className="navbar-search-trigger">
        <div className="relative">
          <Input
            type="text"
            name="search"
            value={searchTerm.search}
            onChange={handleChange}
            onFocus={() => setSearchOpen(true)}
            placeholder={isLoading ? "" : t("common.searchPlaceholder")}
            className="navbar-search placeholder:text-gray-400"
            autoComplete="off"
          />
          {isLoading ? (
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <LoadingSkeleton width="w-32" height="h-4" />
            </div>
          ) : (
            <FiSearch
              className="navbar-search-icon"
              onClick={handleIconClick}
            />
          )}
        </div>
      </div>

      {searchOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-start"
          onClick={handleSearchClose}
        >
          <div
            className="bg-background/40 backdrop-blur-sm rounded-r-md shadow-xl w-full max-w-4xl h-screen overflow-hidden animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900">
              <h2 className="text-xl text-foreground font-bold mb-4">
                {t("search.title")}
              </h2>
              <form className="relative" onSubmit={(e) => e.preventDefault()}>
                <Input
                  type="text"
                  name="search"
                  value={searchTerm.search}
                  onChange={handleChange}
                  placeholder={t("search.placeholder")}
                  className="w-full pl-10 pr-4 py-2 rounded-full text-md"
                  autoComplete="off"
                  autoFocus
                />
                <svg
                  className="absolute left-3 top-3 h-5 w-5 text-muted-foreground"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </form>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
              {isSearching ? (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(6)].map((_, index) => (
                      <div
                        key={index}
                        className="bg-card rounded-lg shadow-md overflow-hidden transition-all duration-300"
                      >
                        <div className="flex">
                          <div className="w-1/3">
                            <LoadingSkeleton
                              width="w-full"
                              height="h-[120px]"
                            />
                          </div>
                          <div className="w-2/3 p-4">
                            <LoadingSkeleton
                              width="w-3/4"
                              height="h-4"
                              className="mb-2"
                            />
                            <LoadingSkeleton
                              width="w-1/2"
                              height="h-4"
                              className="mb-4"
                            />
                            <div className="flex items-center mb-2">
                              <LoadingSkeleton width="w-16" height="h-4" />
                            </div>
                            <div className="flex justify-between items-center mb-2">
                              <LoadingSkeleton width="w-20" height="h-6" />
                              <LoadingSkeleton width="w-16" height="h-4" />
                            </div>
                            <LoadingSkeleton
                              width="w-24"
                              height="h-4"
                              className="mt-2"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : error ? (
                <div className="p-6 text-center text-red-500">{error}</div>
              ) : firstTwelveItems && firstTwelveItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                  {firstTwelveItems.map((prod) => (
                    <div
                      key={prod._id}
                      className="bg-card rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg"
                    >
                      <div className="flex">
                        <div className="w-1/3">
                          <Link
                            onClick={handleSearchClose}
                            href={`/product/${prod._id}`}
                          >
                            <Image
                              src={prod.images[0] || "/placeholder-watch.jpg"}
                              alt={prod.name}
                              width={120}
                              height={120}
                              quality={100}
                              className="object-cover w-full h-full"
                            />
                          </Link>
                        </div>
                        <div className="w-2/3 p-4">
                          <Link
                            onClick={handleSearchClose}
                            href={`/product/${prod._id}`}
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium leading-none text-foreground">
                                {prod.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {prod.brand?.displayNames?.en ||
                                  prod.brand?.name}
                              </p>
                            </div>
                          </Link>
                          <div className="flex items-center mb-2">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="ml-1 text-sm text-muted-foreground">
                              {prod.averageRating
                                ? prod.averageRating.toFixed(1)
                                : "0.0"}{" "}
                              ({prod.numReviews || 0} {t("common.reviews")})
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-primary">
                              ${prod.price.toFixed(2)}
                            </span>
                            {prod.originalPrice && (
                              <span className="text-sm text-muted-foreground line-through">
                                ${prod.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                          {(prod.movement ||
                            prod.casematerial ||
                            prod.glass) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {[prod.movement, prod.casematerial, prod.glass]
                                .filter(Boolean)
                                .join(" | ")}
                            </p>
                          )}
                          <Link
                            onClick={handleSearchClose}
                            href={`/product/${prod._id}`}
                            className="mt-2 text-sm text-primary hover:text-primary/80 transition-colors duration-300 flex items-center"
                          >
                            {t("common.moreDetails")}
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchTerm.search ? (
                <div className="p-6 text-center text-muted-foreground">
                  {t("search.noResults")}
                </div>
              ) : null}
            </div>
            {firstTwelveItems && resultArr.length > 12 && (
              <div className="p-4 bg-muted border-t border-border flex justify-center">
                <Button
                  variant="default"
                  className="px-6 py-2"
                  onClick={handleSearchClose}
                >
                  <Link href={`/searchedProducts/${searchTerm.search}`}>
                    {t("search.showAllResults")}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default SearchDrawer;
