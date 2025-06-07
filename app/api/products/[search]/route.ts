import connect from "@/utils/config/dbConnection";
import Product from "@/utils/models/Product";
import Brand from "@/utils/models/Brand";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { search: string } }
) {
  try {
    await connect();
    const searchTerm = params.search;
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
        { message: "No products found" },
        { status: 404 }
      );
    }

    return NextResponse.json(foundProducts);
  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json(
      { message: "Error searching products" },
      { status: 500 }
    );
  }
}
