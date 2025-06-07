// components/SortDropdown.jsx
import { useState } from "react";

type SortOption = "price_asc" | "price_desc" | "newest" | "oldest";

interface SortDropdownProps {
  onSort: (sortOrder: SortOption) => void;
  currentSort: SortOption;
}

export default function SortDropdown({
  onSort,
  currentSort,
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSort = (sortOrder: SortOption) => {
    onSort(sortOrder);
    setIsOpen(false);
  };

  const getSortLabel = () => {
    switch (currentSort) {
      case "price_asc":
        return "Price: Low to High";
      case "price_desc":
        return "Price: High to Low";
      case "newest":
        return "Newest First";
      case "oldest":
        return "Oldest First";
      default:
        return "Sort by";
    }
  };

  return (
    <div className="relative inline-block text-left mb-4">
      <div>
        <button
          type="button"
          className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
          onClick={() => setIsOpen(!isOpen)}
        >
          {getSortLabel()}
          <svg
            className="-mr-1 ml-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div
            className="py-1"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="options-menu"
          >
            <button
              onClick={() => handleSort("price_asc")}
              className={`block w-full text-left px-4 py-2 text-sm ${
                currentSort === "price_asc"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
              role="menuitem"
            >
              Price: Low to High
              {currentSort === "price_asc" && (
                <span className="ml-2 text-indigo-600">✓</span>
              )}
            </button>
            <button
              onClick={() => handleSort("price_desc")}
              className={`block w-full text-left px-4 py-2 text-sm ${
                currentSort === "price_desc"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
              role="menuitem"
            >
              Price: High to Low
              {currentSort === "price_desc" && (
                <span className="ml-2 text-indigo-600">✓</span>
              )}
            </button>
            <button
              onClick={() => handleSort("newest")}
              className={`block w-full text-left px-4 py-2 text-sm ${
                currentSort === "newest"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
              role="menuitem"
            >
              Newest First
              {currentSort === "newest" && (
                <span className="ml-2 text-indigo-600">✓</span>
              )}
            </button>
            <button
              onClick={() => handleSort("oldest")}
              className={`block w-full text-left px-4 py-2 text-sm ${
                currentSort === "oldest"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              }`}
              role="menuitem"
            >
              Oldest First
              {currentSort === "oldest" && (
                <span className="ml-2 text-indigo-600">✓</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
