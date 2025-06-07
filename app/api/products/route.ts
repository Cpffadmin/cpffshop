/* eslint-disable @typescript-eslint/no-unused-vars */
import { connectToDatabase, waitForConnection } from "@/utils/database";
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth.config";
import Product from "@/utils/models/Product";
import Category from "@/utils/models/Category";
import mongoose from "mongoose";
import { logger } from "@/utils/logger";
import dbConnect from "@/utils/config/dbConnection";
import Brand from "@/utils/models/Brand";
import { Types } from "mongoose";
import { createRouteHandler } from "@/utils/routeHandler";
import "@/utils/models"; // Ensure models are registered

export const dynamic = "force-dynamic";

// Cache for products list
const productsCache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface Specification {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  required?: boolean;
  options?: string[];
}

interface ProductQuery {
  price: {
    $gte: number;
    $lte: number;
  };
  draft: {
    $ne: boolean;
  };
  brand?: string;
  category?: Types.ObjectId;
}

interface SortQuery {
  [key: string]: 1 | -1;
}

interface ProductSpecification {
  key: string;
  value: string | number;
  type: "text" | "number" | "select";
}

interface ProductData {
  user: string;
  name: string;
  description: string;
  brand: string;
  images: string[];
  price: number;
  originalPrice: number;
  stock: number;
  category: string;
  specifications: ProductSpecification[];
  draft?: boolean;
}

interface QueryParams {
  page?: string;
  limit?: string;
  sort?: string;
  brand?: string;
  minPrice?: string;
  maxPrice?: string;
  search?: string;
  category?: string;
}

interface SortOptions {
  [key: string]: { [key: string]: 1 | -1 };
}

interface SortOrder {
  [key: string]: 1 | -1;
}

const handleProducts = createRouteHandler();

export async function GET(request: NextRequest) {
  return handleProducts(async () => {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const minPrice = parseFloat(searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "999999");
    const brandId = searchParams.get("brand") || undefined;
    const categoryId = searchParams.get("category") || undefined;
    const includeDrafts = searchParams.get("includeDrafts") === "true";
    const featured = searchParams.get("featured") === "true";
    const language = searchParams.get("language") || "en";

    // Create cache key based on query parameters
    const cacheKey = JSON.stringify({
      page,
      limit,
      minPrice,
      maxPrice,
      brandId,
      categoryId,
      includeDrafts,
      featured,
    });

    // Check cache first
    const cachedData = productsCache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      // Return cached data with the requested language
      return {
        ...cachedData,
        products: cachedData.products.map((product: any) => ({
          ...product,
          name: product.displayNames?.[language] || product.name,
          description: product.descriptions?.[language] || product.description,
          brand: {
            ...product.brand,
            name: product.brand.displayNames?.[language] || product.brand.name,
          },
          category: {
            ...product.category,
            name:
              product.category?.displayNames?.[language] ||
              product.category?.name,
          },
        })),
      };
    }

    const query: any = {
      price: {
        $gte: minPrice,
        $lte: maxPrice,
      },
    };

    // Only include non-draft products unless explicitly requested
    if (!includeDrafts) {
      query.draft = { $ne: true };
    }

    if (brandId) {
      query.brand = brandId;
    }

    if (categoryId) {
      query.category = new Types.ObjectId(categoryId);
    }

    if (featured) {
      query.featured = true;
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate("brand")
        .populate("category")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    // Store in cache
    const response = {
      products: products.map((product: any) => ({
        ...product,
        name: product.displayNames?.[language] || product.name,
        displayNames: product.displayNames || {
          en: product.name,
          "zh-TW": product.name,
        },
        description: product.descriptions?.[language] || product.description,
        brand: {
          ...product.brand,
          name: product.brand.displayNames?.[language] || product.brand.name,
        },
        category: {
          ...product.category,
          name:
            product.category?.displayNames?.[language] ||
            product.category?.name,
        },
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      timestamp: Date.now(),
    };

    productsCache.set(cacheKey, response);
    return response;
  });
}

export async function POST(request: Request) {
  return handleProducts(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      throw new Error("Unauthorized");
    }

    const data: ProductData = await request.json();

    // Validate required fields
    if (!data.name || !data.description || !data.brand || !data.category) {
      throw new Error("Missing required fields");
    }

    // Create product
    const product = await Product.create({
      ...data,
      displayNames: {
        en: data.name,
        "zh-TW": data.name,
      },
      descriptions: {
        en: data.description,
        "zh-TW": data.description,
      },
      user: session.user._id,
    });

    return { success: true, product };
  });
}
