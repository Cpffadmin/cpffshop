"use client";

import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import axios from "axios";
import { Brand } from "@/types";

interface SortDropdownProps {
  onSortChange: (value: string) => void;
  currentSort?: string;
}

export default function SortDropdown({
  onSortChange,
  currentSort = "newest",
}: SortDropdownProps) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await axios.get("/api/brands");
        setBrands(response.data.brands || []);
      } catch (error) {
        console.error("Error fetching brands:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, []);

  const getSortLabel = (value: string) => {
    switch (value) {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {getSortLabel(currentSort)}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <DropdownMenuItem
          onClick={() => onSortChange("price_asc")}
          className={currentSort === "price_asc" ? "bg-accent" : ""}
        >
          Price: Low to High
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onSortChange("price_desc")}
          className={currentSort === "price_desc" ? "bg-accent" : ""}
        >
          Price: High to Low
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onSortChange("newest")}
          className={currentSort === "newest" ? "bg-accent" : ""}
        >
          Newest First
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onSortChange("oldest")}
          className={currentSort === "oldest" ? "bg-accent" : ""}
        >
          Oldest First
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
