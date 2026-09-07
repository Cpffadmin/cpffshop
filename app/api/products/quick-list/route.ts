import { NextResponse } from "next/server";
import { connectToDatabase, waitForConnection } from "@/utils/database";
import Product from "@/utils/models/Product";
import "@/utils/models"; // Ensure Brand/Category are registered for populate

export const dynamic = "force-dynamic";

// Trimmed catalogue for the quick order form, which lists every product at once.
// Descriptions, specification values and review data are deliberately excluded —
// they would multiply the payload by an order of magnitude for ~300 rows.
export async function GET() {
  try {
    await connectToDatabase();
    const isConnected = await waitForConnection(10000);

    if (!isConnected) {
      throw new Error("Database connection timeout");
    }

    const products = await Product.find({ draft: { $ne: true } })
      .select("name displayNames price images stock category order")
      .populate("category", "name displayNames specifications")
      .sort({ order: 1, name: 1 })
      .lean();

    const items = products.map((product: any) => {
      const category = product.category;

      return {
        _id: String(product._id),
        name: product.name,
        displayNames: product.displayNames,
        price: product.price,
        image: product.images?.[0] || "/placeholder-product.jpg",
        stock: Number(product.stock ?? 0),
        category: category
          ? {
              _id: String(category._id),
              name: category.name,
              displayNames: category.displayNames,
            }
          : null,
        // Only a select-type spec is an actual choice the buyer must make (and
        // the only kind that can change price). Text specs such as `origin` are
        // informational, so those products keep their quantity stepper.
        hasSpecifications: Array.isArray(category?.specifications)
          ? category.specifications.some(
              (spec: any) => spec?.type === "select" && spec?.options
            )
          : false,
      };
    });

    return NextResponse.json({ products: items, total: items.length });
  } catch (error) {
    console.error("Error fetching quick order products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
