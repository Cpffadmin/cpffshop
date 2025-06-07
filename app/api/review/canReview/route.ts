/* eslint-disable @typescript-eslint/no-explicit-any */
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/auth.config";
import { Order } from "@/utils/models/Order";
import mongoose from "mongoose";
import Review from "@/utils/models/Review";
import { createRouteHandler } from "@/utils/routeHandler";

// Mark this route as dynamic
export const dynamic = "force-dynamic";

const handleCanReview = createRouteHandler({ requireAuth: true });

export async function GET(req: Request) {
  return handleCanReview(async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { canReview: false };
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      throw new Error("Invalid product id");
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error("Invalid product id");
    }

    const objectIdProductId = new mongoose.Types.ObjectId(productId);

    const hasPurchased = await Order.findOne({
      user: session.user._id,
      "cartProducts.product": objectIdProductId,
      status: "delivered",
      paid: true,
    });

    if (!hasPurchased) {
      return { canReview: false };
    }

    const hasReviewed = await Review.findOne({
      user: session.user._id,
      product: objectIdProductId,
    });

    return { canReview: !hasReviewed };
  });
}
