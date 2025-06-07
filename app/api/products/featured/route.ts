import { NextResponse } from "next/server";
import { connectToDatabase, waitForConnection } from "@/utils/database";
import Product from "@/utils/models/Product";
import Brand from "@/utils/models/Brand";
import Category from "@/utils/models/Category";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const isConnected = await waitForConnection(10000); // Wait up to 10 seconds
    if (!isConnected) {
      throw new Error("Database connection timeout");
    }

    // Ensure models are registered
    if (!mongoose.models.Brand) {
      mongoose.model("Brand", Brand.schema);
    }
    if (!mongoose.models.Category) {
      mongoose.model("Category", Category.schema);
    }

    const products = await Product.find({ featured: true })
      .populate("brand", "name displayNames")
      .populate("category", "name displayNames")
      .select(
        "name displayNames description images price originalPrice brand category specifications averageRating numReviews"
      )
      .limit(8);

    // Transform the data to a simplified object array
    const transformedProducts = products.map((product) => ({
      id: product._id.toString(),
      displayNames: product.displayNames,
      price: product.price,
      images: product.images,
      image: product.images?.[0] || "/default-product.jpg",
      link: `/products/${product._id}`,
      brand: product.brand,
      category: product.category,
      description: product.description,
      originalPrice: product.originalPrice,
      specifications: product.specifications,
      averageRating: product.averageRating,
      numReviews: product.numReviews,
    }));

    return NextResponse.json(transformedProducts);
  } catch (error) {
    console.error("Error fetching featured products:", error);
    return NextResponse.json(
      { error: "Failed to fetch featured products" },
      { status: 500 }
    );
  }
}
