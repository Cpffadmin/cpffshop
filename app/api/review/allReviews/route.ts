/* eslint-disable @typescript-eslint/no-explicit-any */
import Review from "@/utils/models/Review";
import { createRouteHandler } from "@/utils/routeHandler";

// Mark this route as dynamic
export const dynamic = "force-dynamic";

const handleReviews = createRouteHandler();

export async function GET(request: Request) {
  return handleReviews(async () => {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const skip = (page - 1) * limit;

    const [totalReviews, reviews] = await Promise.all([
      Review.countDocuments({}),
      Review.find({})
        .populate("user", "name profileImage")
        .populate("product", "name images")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return {
      reviews,
      total: totalReviews,
      page,
      totalPages: Math.ceil(totalReviews / limit),
    };
  });
}
