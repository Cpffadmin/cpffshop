import { NextResponse } from "next/server";
import connect from "@/utils/config/dbConnection";
import Product from "@/utils/models/Product";
import Brand from "@/utils/models/Brand";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await connect();

    const url = new URL(request.url);
    const searchTerm = url.searchParams.get("q");

    if (!searchTerm) {
      return NextResponse.json(
        { error: "Search term is required" },
        { status: 400 }
      );
    }

    const searchTermRegex = new RegExp(searchTerm, "i");

    const foundProducts = await Product.find({
      $or: [
        { name: { $regex: searchTermRegex } },
        { description: { $regex: searchTermRegex } },
      ],
    })
      .populate({
        path: "brand",
        model: Brand,
        select: "name displayNames",
      })
      .lean();

    if (!foundProducts || foundProducts.length === 0) {
      return NextResponse.json(
        { products: [], message: "No products found" },
        { status: 200 }
      );
    }

    return NextResponse.json({ products: foundProducts });
  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json(
      { error: "Error searching products" },
      { status: 500 }
    );
  }
}
