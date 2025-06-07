import { NextResponse } from "next/server";
import dbConnect from "@/utils/config/dbConnection";
import Category from "@/utils/models/Category";

export const dynamic = "force-dynamic";

// GET all categories (public endpoint)
export async function GET() {
  try {
    await dbConnect();
    const categories = await Category.find().sort({ createdAt: -1 });

    if (!categories || categories.length === 0) {
      return NextResponse.json({ categories: [] });
    }

    return NextResponse.json({ categories });
  } catch (error: unknown) {
    console.error("GET categories error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch categories",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
