import { NextResponse } from "next/server";
import { connectToDatabase, waitForConnection } from "@/utils/database";
import Product from "@/utils/models/Product";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET() {
  let retries = 3;

  while (retries > 0) {
    try {
      await connectToDatabase();

      // Wait for connection to be ready with timeout
      const isConnected = await waitForConnection();
      if (!isConnected) {
        throw new Error("Database connection timeout");
      }

      const products = await Product.find({ featured: true })
        .populate("brand", "name displayNames")
        .populate("category", "name displayNames")
        .select(
          "name displayNames description images price originalPrice brand category specifications averageRating numReviews"
        )
        .limit(8);
      return NextResponse.json(products);
    } catch (error) {
      console.error(
        `Failed to fetch featured products (retries left: ${retries - 1}):`,
        error
      );

      if (retries <= 1) {
        return NextResponse.json(
          { error: "Failed to fetch featured products" },
          { status: 500 }
        );
      }

      // Wait longer between retries
      await new Promise((resolve) => setTimeout(resolve, 2000));
      retries--;
    }
  }

  return NextResponse.json(
    { error: "Failed to establish database connection" },
    { status: 500 }
  );
}
