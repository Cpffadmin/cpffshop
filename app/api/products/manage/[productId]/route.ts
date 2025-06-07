import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { connectToDatabase } from "@/utils/database";
import Product from "@/utils/models/Product";
import Category from "@/utils/models/Category";
import Brand from "@/utils/models/Brand";
import mongoose from "mongoose";
import { logger } from "@/utils/logger";
import type { Product as ProductType } from "@/types";
import { Document } from "mongoose";

interface Params {
  productId: string;
}

interface ProductData extends Document {
  user: string;
  name: string;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  description: string;
  descriptions: {
    en: string;
    "zh-TW": string;
  };
  brand: mongoose.Types.ObjectId | string;
  images: string[];
  price: number;
  originalPrice: number;
  stock: number;
  category: mongoose.Types.ObjectId | string;
  specifications: Array<{
    key: string;
    value: string | number | { en: string; "zh-TW": string };
    type: string;
  }>;
  draft: boolean;
}

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    await connectToDatabase();

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.productId)) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // Fetch product with populated brand and category
    const product = (await Product.findById(params.productId)
      .populate({
        path: "brand",
        select: "name displayNames isActive",
      })
      .populate({
        path: "category",
        select: "name displayNames specifications",
      })
      .lean()) as unknown as ProductData & {
      _id: mongoose.Types.ObjectId;
      brand: {
        _id: mongoose.Types.ObjectId;
        name: string;
        displayNames: { en: string; "zh-TW": string };
        isActive: boolean;
      };
      category: {
        _id: mongoose.Types.ObjectId;
        name: string;
        displayNames: { en: string; "zh-TW": string };
        specifications: Array<{
          key: string;
          displayNames?: { en: string; "zh-TW": string };
          label?: string;
        }>;
      };
      createdAt: Date;
      updatedAt: Date;
    };

    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    // Format the response
    const formattedProduct = {
      ...product,
      _id: product._id.toString(),
      brand: {
        _id: product.brand._id.toString(),
        name: product.brand.name,
        displayNames: product.brand.displayNames,
        isActive: product.brand.isActive,
      },
      category: product.category._id.toString(),
      specifications: product.specifications.map((spec) => ({
        key: spec.key,
        value: spec.value,
        type: spec.type,
      })),
      user: product.user.toString(),
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };

    return NextResponse.json(formattedProduct);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Params }
): Promise<NextResponse> {
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    const { productId } = params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.admin) {
      await mongoSession.abortTransaction();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = (await request.json()) as ProductData;

    try {
      // Find the product first to get category and brand IDs
      const product = (await Product.findById(productId)
        .session(mongoSession)
        .lean()) as unknown as ProductData;
      if (!product) {
        await mongoSession.abortTransaction();
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      // Update the product
      const updatedProduct = (await Product.findByIdAndUpdate(
        productId,
        {
          ...data,
          user: session.user._id,
        },
        { new: true, runValidators: true }
      )
        .session(mongoSession)
        .populate({
          path: "brand",
          select: "name displayNames",
        })
        .populate({
          path: "category",
          select: "name displayNames specifications",
        })
        .lean()) as unknown as ProductType;

      await mongoSession.commitTransaction();

      return NextResponse.json(updatedProduct);
    } catch (error) {
      await mongoSession.abortTransaction();
      logger.error("Error updating product:", { error });
      throw error;
    }
  } catch (error) {
    await mongoSession.abortTransaction();
    logger.error("Error in PUT /api/products/manage/[productId]:", { error });
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  } finally {
    await mongoSession.endSession();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Params }
): Promise<NextResponse> {
  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      await mongoSession.abortTransaction();
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId } = params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      await mongoSession.abortTransaction();
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    // Find the product first to get category and brand IDs
    const product = (await Product.findById(productId)
      .session(mongoSession)
      .lean()) as unknown as ProductData;

    if (!product) {
      await mongoSession.abortTransaction();
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Delete the product
    await Product.findByIdAndDelete(productId).session(mongoSession);

    // Remove product reference from category
    if (product.category) {
      await Category.findByIdAndUpdate(product.category, {
        $pull: { products: productId },
      }).session(mongoSession);
    }

    // Remove product reference from brand
    if (product.brand) {
      await Brand.findByIdAndUpdate(product.brand, {
        $pull: { products: productId },
      }).session(mongoSession);
    }

    await mongoSession.commitTransaction();
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    await mongoSession.abortTransaction();
    logger.error("Error in DELETE /api/products/manage/[productId]:", {
      error,
    });
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  } finally {
    await mongoSession.endSession();
  }
}
