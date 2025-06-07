import { NextResponse } from "next/server";
import Brand from "@/utils/models/Brand";
import BrandBeta from "@/utils/models/BrandBeta";
import dbConnect from "@/utils/config/dbConnection";

export async function GET() {
  try {
    await dbConnect();

    // Try to get brands from the new model first
    let brands = await Brand.find({ isActive: true }).sort({ order: 1 });

    // If no brands found in new model, try the beta model
    if (!brands || brands.length === 0) {
      brands = await BrandBeta.find({ isActive: true }).sort({ order: 1 });
    }

    if (!brands || brands.length === 0) {
      return NextResponse.json({ brands: [] });
    }

    return NextResponse.json({ brands });
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch brands",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
