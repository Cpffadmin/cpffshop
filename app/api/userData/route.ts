/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from "mongoose";
import User from "@/utils/models/User";
import Product from "@/utils/models/Product";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth.config";
import { createRouteHandler } from "@/utils/routeHandler";
import { Session } from "next-auth";

export const dynamic = "force-dynamic";

const handleUserData = createRouteHandler({ requireAuth: true });

// Cart items are stored as snapshots on the user document, so deleting a
// product leaves an orphan that keeps reappearing after every "clear cart".
// Drop those items and persist the cleaned cart so they stop coming back.
async function removeDeletedProductsFromCart(
  userId: mongoose.Types.ObjectId,
  cart: unknown
): Promise<any[]> {
  if (!Array.isArray(cart) || cart.length === 0) {
    return Array.isArray(cart) ? cart : [];
  }

  const productIds = cart
    .map((item) => String(item?._id ?? ""))
    .filter((id) => mongoose.Types.ObjectId.isValid(id));

  const existingProducts = await Product.find({ _id: { $in: productIds } })
    .select("_id")
    .lean();
  const existingIds = new Set(
    existingProducts.map((product) => String(product._id))
  );

  const liveCart = cart.filter((item) =>
    existingIds.has(String(item?._id ?? ""))
  );

  if (liveCart.length !== cart.length) {
    await User.updateOne({ _id: userId }, { $set: { cart: liveCart } });
  }

  return liveCart;
}

// Helper function to get user name from session
function getUserNameFromSession(session: Session): string {
  const email = session.user?.email;
  if (!email) throw new Error("Email is required");

  return session.user?.name || email.split("@")[0];
}

export async function GET() {
  return handleUserData(async () => {
    const session = await getServerSession(authOptions);

    // Require a valid session with complete user data
    if (!session?.user?.email || !session?.user?.id) {
      return new Response(JSON.stringify({
        authenticated: false,
        message: "Invalid session"
      }), { status: 401 });
    }

    // Try to find the user first
    let user = await User.findOne({ email: session.user.email }).select(
      "-password"
    );

    // If user doesn't exist, create a new one with session data
    if (!user) {
      try {
        const userName = getUserNameFromSession(session);
        user = await User.create({
          email: session.user.email,
          name: userName,
          profileImage: session.user.image || "/profile.jpg",
        });
      } catch (error) {
        console.error("Error creating new user:", error);
        throw new Error("Failed to create user");
      }
    }

    // Convert to plain object and ensure address structure
    const userObj = user.toObject();
    userObj.cart = await removeDeletedProductsFromCart(user._id, userObj.cart);
    if (!userObj.address) {
      userObj.address = {
        en: "",
        "zh-TW": "",
      };
    }
    return {
      authenticated: true,
      user: userObj,
    };
  });
}

export async function PATCH(request: Request) {
  return handleUserData(async () => {
    const session = await getServerSession(authOptions);

    // Return error response if not authenticated
    if (!session?.user?.email) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401 }
      );
    }

    const data = await request.json();

    // Validate cart data if it exists
    if (data.cart !== undefined && !Array.isArray(data.cart)) {
      throw new Error("Invalid cart data: must be an array");
    }

    const userName = getUserNameFromSession(session);

    // Try to find and update the user, or create if doesn't exist
    const user = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        $set: {
          ...data,
          name: data.name || userName,
          email: session.user.email,
        },
      },
      {
        new: true,
        upsert: true,
        select: "-password",
      }
    );

    return { authenticated: true, user };
  });
}
