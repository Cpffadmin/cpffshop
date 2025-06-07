import { NextResponse } from "next/server";
import { connectToDatabase, waitForConnection } from "@/utils/database";
import Product from "@/utils/models/Product";
import Brand from "@/utils/models/Brand";
import Category from "@/utils/models/Category";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

interface Review {
  rating: number;
}

export async function GET() {
  try {
    // Connect to database and wait for connection
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

    const products = await Product.find({ isBestSelling: true })
      .populate("brand", "name")
      .populate("category", "name")
      .select("name displayNames price images rating brand category")
      .limit(12);

    // Transform the data to match the Watch interface
    const transformedProducts = products.map((product) => {
      // Calculate average rating from reviews if available
      let avgRating: number | null = null;
      if (
        product.reviews &&
        Array.isArray(product.reviews) &&
        product.reviews.length > 0
      ) {
        const sum = product.reviews.reduce(
          (acc: number, review: Review) => acc + (review.rating || 0),
          0
        );
        avgRating = parseFloat((sum / product.reviews.length).toFixed(1));
      } else if (typeof product.rating === "number") {
        avgRating = product.rating;
      }
      return {
        id: product._id.toString(),
        displayNames: product.displayNames, // Return all languages
        price: product.price,
        rating: avgRating,
        image: product.images[0] || "/default-product.jpg",
        link: `/products/${product._id}`,
      };
    });

    return NextResponse.json(transformedProducts);
  } catch (error) {
    console.error("Error fetching best-selling products:", error);
    return NextResponse.json(
      { error: "Failed to fetch best-selling products" },
      { status: 500 }
    );
  }
}
