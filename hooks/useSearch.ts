import { useState, useCallback, useEffect, useRef } from "react";
import axios from "axios";
import type { Brand } from "@/types";

interface SearchResult {
  _id: string;
  name: string;
  price: number;
  images: string[];
  averageRating: number;
  numReviews: number;
  originalPrice: number;
  brand?: Brand;
}

export const useSearch = () => {
  const [searchTerm, setSearchTerm] = useState<{ search: string }>({
    search: "",
  });
  const [resultArr, setResultArr] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();
  const abortController = useRef<AbortController | null>(null);

  const handleSubmit = useCallback(async (search: string) => {
    if (!search) return;

    // Cancel previous request if it exists
    if (abortController.current) {
      abortController.current.abort();
    }

    // Create new abort controller for this request
    abortController.current = new AbortController();

    setIsSearching(true);
    setError(null);

    try {
      const res = await axios.get(
        `/api/search?q=${encodeURIComponent(search)}`,
        {
          signal: abortController.current.signal,
        }
      );
      if (res.status === 200) {
        setResultArr(res.data.products || []);
        if (res.data.message) {
          setError(res.data.message);
        }
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        // Don't set error if request was cancelled
        if (error.name === "CanceledError") return;

        if (error.response?.status === 404) {
          setResultArr([]);
          setError("No products found matching your search");
        } else if (error.response?.status === 500) {
          setError("Server error. Please try again later");
        } else {
          setError("An error occurred while searching. Please try again.");
        }
        console.error("Search error:", error);
      }
    } finally {
      if (abortController.current?.signal.aborted) return;
      setIsSearching(false);
    }
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const trimmedValue = value.trim();

      setSearchTerm((prev) => ({ ...prev, [name]: value }));
      setError(null);

      // Clear previous timeout
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }

      // If empty value, clear results immediately
      if (!trimmedValue) {
        setResultArr([]);
        return;
      }

      // Debounce search for 300ms and trigger on any non-empty input
      searchTimeout.current = setTimeout(() => {
        handleSubmit(trimmedValue);
      }, 300);
    },
    [handleSubmit]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  const clearSearch = useCallback(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    if (abortController.current) {
      abortController.current.abort();
    }
    setSearchTerm({ search: "" });
    setResultArr([]);
    setError(null);
    setIsSearching(false);
  }, []);

  const firstTwelveItems = resultArr.slice(0, 12);

  return {
    searchTerm,
    resultArr,
    isSearching,
    error,
    firstTwelveItems,
    handleChange,
    clearSearch,
  };
};
