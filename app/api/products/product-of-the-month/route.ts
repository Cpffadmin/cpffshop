import { NextResponse } from "next/server";
import Product from "@/utils/models/Product";
import "@/utils/models/Brand";
import "@/utils/models/Category";
import { connectToDatabase, waitForConnection } from "@/utils/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectToDatabase();
    const isConnected = await waitForConnection();
    if (!isConnected) {
      throw new Error("Database connection timeout");
    }

    const product = await Product.findOne({ isProductOfTheMonth: true })
      .populate("brand", "name displayNames")
      .populate("category", "name displayNames")
      .select("-__v -createdAt -updatedAt");

    return NextResponse.json(
      {
        data: product || null,
        status: "success",
        message: product
          ? "Product of the month found"
          : "No product of the month currently set",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching product of the month:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Error fetching product of the month",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.role || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const isConnected = await waitForConnection();
    if (!isConnected) {
      throw new Error("Database connection timeout");
    }

    const { productId, description, features } = await request.json();

    // First, unset isProductOfTheMonth for all products
    await Product.updateMany(
      { isProductOfTheMonth: true },
      { $set: { isProductOfTheMonth: false } }
    );

    // Then, set the new product of the month
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        $set: {
          isProductOfTheMonth: true,
          productOfTheMonthDetails: {
            description,
            features,
          },
        },
      },
      { new: true }
    )
      .populate("brand", "name displayNames")
      .populate("category", "name displayNames")
      .select("-__v -createdAt -updatedAt");

    if (!updatedProduct) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product of the month:", error);
    return NextResponse.json(
      { message: "Error updating product of the month" },
      { status: 500 }
    );
  }
}
