import Product from "@/utils/models/Product";
import { createRouteHandler } from "@/utils/routeHandler";

export const dynamic = "force-dynamic";

const handleProducts = createRouteHandler();

export async function GET(req: Request) {
  return handleProducts(async () => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");

    const skip = (page - 1) * limit;

    const [totalProducts, foundProducts] = await Promise.all([
      Product.countDocuments({}),
      Product.find({})
        .populate("user")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    if (!foundProducts) {
      throw new Error("Products not found");
    }

    return {
      products: foundProducts,
      total: totalProducts,
      page,
      totalPages: Math.ceil(totalProducts / limit),
    };
  });
}
