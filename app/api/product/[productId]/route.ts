import { NextResponse } from "next/server";
import Product from "@/utils/models/Product";
import Brand from "@/utils/models/Brand";
import Category from "@/utils/models/Category";
import dbConnect from "@/utils/config/dbConnection";
import { Types } from "mongoose";
import type { Product as ProductType } from "@/types";

type Language = "en" | "zh-TW";

interface ProductBrand {
  _id: Types.ObjectId | string;
  name: string;
  displayNames: Record<Language, string>;
  slug?: string;
  icon?: string;
  isActive?: boolean;
}

const defaultBrand: ProductBrand = {
  _id: "default",
  name: "No Brand",
  displayNames: {
    en: "No Brand",
    "zh-TW": "無品牌",
  },
  slug: "no-brand",
  icon: "Watch",
  isActive: true,
};

// Cache for product data
const productCache = new Map<string, any>();

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    await dbConnect();
    const { productId } = params;
    const { searchParams } = new URL(request.url);
    const language = (searchParams.get("language") || "en") as Language;

    if (!productId) {
      return NextResponse.json(
        { message: "Product ID is required" },
        { status: 400 }
      );
    }

    // Check cache first
    const cachedProduct = productCache.get(productId);
    if (cachedProduct) {
      // Return cached data with the requested language
      const response = {
        ...cachedProduct,
        name: cachedProduct.displayNames?.[language] || cachedProduct.name,
        description:
          cachedProduct.descriptions?.[language] || cachedProduct.description,
        brand: {
          ...cachedProduct.brand,
          name:
            cachedProduct.brand.displayNames?.[language] ||
            cachedProduct.brand.name,
        },
        category: {
          ...cachedProduct.category,
          name:
            cachedProduct.category?.displayNames?.[language] ||
            cachedProduct.category?.name,
        },
        specifications: cachedProduct.specifications.map((spec: any) => ({
          ...spec,
          label: spec.displayNames?.[language] || spec.key,
        })),
      };
      return NextResponse.json({ product: response });
    }

    // If not in cache, fetch from database
    const doc = await Product.findById(productId)
      .populate({
        path: "brand",
        model: Brand,
        select: "name displayNames slug icon isActive",
      })
      .populate({
        path: "category",
        model: Category,
        select: "name displayNames specifications",
      })
      .lean();

    if (!doc) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    const product = doc as unknown as ProductType;
    const brand = product.brand || defaultBrand;

    // Store in cache
    const productData = {
      _id: product._id.toString(),
      name: product.displayNames?.[language] || product.name,
      displayNames: product.displayNames || {
        en: product.name,
        "zh-TW": product.name,
      },
      description: product.descriptions?.[language] || product.description,
      descriptions: product.descriptions || {
        en: product.description,
        "zh-TW": product.description,
      },
      images: product.images,
      price: product.price,
      originalPrice: product.originalPrice,
      brand: {
        _id: brand._id.toString(),
        name: brand.displayNames?.[language] || brand.name,
        displayNames: brand.displayNames || {
          en: brand.name,
          "zh-TW": brand.name,
        },
      },
      category: {
        _id: product.category?._id.toString(),
        name:
          product.category?.displayNames?.[language] || product.category?.name,
        displayNames: product.category?.displayNames || {
          en: product.category?.name || "",
          "zh-TW": product.category?.name || "",
        },
      },
      specifications: Array.isArray(product.specifications)
        ? product.specifications.map((spec) => ({
            key: spec.key,
            value: spec.value,
            type: spec.type || typeof spec.value,
            displayNames: spec.displayNames || {
              en: spec.key,
              "zh-TW": spec.key,
            },
            label: spec.displayNames?.[language] || spec.key,
          }))
        : Object.entries(product.specifications || {}).map(([key, value]) => ({
            key,
            value,
            type: typeof value,
            displayNames: {
              en: key,
              "zh-TW": key,
            },
            label: key,
          })),
      featured: product.featured || false,
      stock: product.stock || 0,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    // Store in cache
    productCache.set(productId, productData);

    return NextResponse.json({ product: productData });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      {
        message: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Clear cache when product is updated
export async function PUT(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    await dbConnect();
    const { productId } = params;
    const body = await req.json();

    const doc = await Product.findByIdAndUpdate(
      productId,
      { ...body },
      { new: true, runValidators: true }
    )
      .populate("brand")
      .lean();

    if (!doc) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // Clear cache
    productCache.delete(productId);

    const product = doc as unknown as ProductType;
    const brand = product.brand || defaultBrand;

    const response = {
      _id: product._id.toString(),
      name: product.name,
      displayNames: product.displayNames,
      description: product.description,
      images: product.images,
      price: product.price,
      originalPrice: product.originalPrice,
      brand: {
        _id: brand._id.toString(),
        name: brand.name,
        displayNames: brand.displayNames || { en: brand.name },
      },
      featured: product.featured || false,
      stock: product.stock || 0,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return NextResponse.json({ product: response });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      {
        message: "Failed to update product",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Clear cache when product is deleted
export async function DELETE(
  req: Request,
  { params }: { params: { productId: string } }
) {
  try {
    await dbConnect();
    const { productId } = params;

    const doc = await Product.findByIdAndDelete(productId)
      .populate("brand")
      .lean();

    if (!doc) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // Clear cache
    productCache.delete(productId);

    const product = doc as unknown as ProductType;
    const brand = product.brand || defaultBrand;

    const response = {
      _id: product._id.toString(),
      name: product.name,
      displayNames: product.displayNames,
      description: product.description,
      images: product.images,
      price: product.price,
      originalPrice: product.originalPrice,
      brand: {
        _id: brand._id.toString(),
        name: brand.name,
        displayNames: brand.displayNames || { en: brand.name },
      },
      featured: product.featured || false,
      stock: product.stock || 0,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return NextResponse.json({ product: response });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      {
        message: "Failed to delete product",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
