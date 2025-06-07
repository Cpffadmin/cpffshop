"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";

declare module "@/types" {
  interface Product {
    originalPrice?: number;
  }
}

const SearchResults = () => {
  const searchParams = useSearchParams();
  const query = searchParams?.get ? searchParams.get("q") || "" : "";
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/products/${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Failed to fetch search results");
        const data = await res.json();
        setResults(data);
      } catch (error) {
        console.error("Error searching products:", error);
        setError("Failed to load search results");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading search results...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">
          No results found for &quot;{query}&quot;
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        Search results for &quot;{query}&quot; ({results.length} items)
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {results.map((item) => (
          <Link key={item._id} href={`/product/${item._id}`} className="group">
            <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform duration-300 group-hover:scale-105">
              <div className="relative h-48 w-full">
                <Image
                  src={item.images[0] || "/placeholder-watch.jpg"}
                  alt={item.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h2 className="font-semibold text-lg mb-2 line-clamp-2">
                  {item.name}
                </h2>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-blue-600">
                      ${item.price}
                    </p>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <p className="text-sm text-gray-500 line-through">
                        ${item.originalPrice}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-yellow-400">
                      {"★".repeat(Math.round(item.averageRating || 0))}
                      {"☆".repeat(5 - Math.round(item.averageRating || 0))}
                    </div>
                    <p className="text-sm text-gray-500">
                      {item.numReviews} reviews
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SearchResults;
