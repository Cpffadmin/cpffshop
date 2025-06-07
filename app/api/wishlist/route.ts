import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth.config";
import { createRouteHandler } from "@/utils/routeHandler";
import { Types } from "mongoose";
// Import models through the index file to ensure registration
import "@/utils/models";
import User from "@/utils/models/User";
import Product from "@/utils/models/Product";
import { Session } from "next-auth";

export const dynamic = "force-dynamic";

const handleWishlist = createRouteHandler({ requireAuth: true });

// Helper function to get user name from session
function getUserNameFromSession(session: Session): string {
  const email = session.user?.email;
  if (!email) throw new Error("Email is required");

  return session.user?.name || email.split("@")[0];
}

// Helper function to get or create user
async function getOrCreateUser(session: Session) {
  if (!session.user?.email) {
    throw new Error("User email is required");
  }

  let user = await User.findOne({ email: session.user.email }).populate(
    "wishlist"
  );

  if (!user) {
    try {
      const userName = getUserNameFromSession(session);
      user = await User.create({
        email: session.user.email,
        name: userName,
        profileImage: session.user.image || "/profile.jpg",
        wishlist: [], // Initialize empty wishlist
      });
      user = await User.findById(user._id).populate("wishlist");
    } catch (error) {
      console.error("Error creating new user:", error);
      throw new Error("Failed to create user");
    }
  }

  return user;
}

export async function GET(req: Request) {
  return handleWishlist(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("User not authenticated");
    }

    // Get language from accept-language header, default to 'en'
    const lang = req?.headers?.get("accept-language")?.split(",")[0] || "en";

    const user = await getOrCreateUser(session);

    // Map wishlist items to include localized name
    const items = (user.wishlist || []).map((product: any) => {
      const localizedName =
        product.displayNames?.[lang] ||
        product.displayNames?.["zh-TW"] ||
        product.displayNames?.en ||
        product.name;
      return {
        ...product.toObject(),
        name: localizedName,
      };
    });

    return {
      items,
      success: true,
    };
  });
}

export async function POST(req: Request) {
  const body = await req.json();

  return handleWishlist(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("User not authenticated");
    }

    const { productId } = body;
    if (!productId) {
      throw new Error("Product ID is required");
    }

    // Get user with populated wishlist
    let user = await User.findOne({ email: session.user.email }).populate(
      "wishlist"
    );
    if (!user) {
      const userName = getUserNameFromSession(session);
      user = await User.create({
        email: session.user.email,
        name: userName,
        profileImage: session.user.image || "/profile.jpg",
        wishlist: [],
      });
      user = await User.findById(user._id).populate("wishlist");
    }

    // Check if product exists in wishlist
    const productObjectId = new Types.ObjectId(productId);
    const isInWishlist = user.wishlist.some((item: any) =>
      item._id.equals(productObjectId)
    );

    // Toggle wishlist status
    if (!isInWishlist) {
      // Add to wishlist
      user.wishlist.push(productId);
    } else {
      // Remove from wishlist
      user.wishlist = user.wishlist.filter(
        (item: any) => !item._id.equals(productObjectId)
      );
    }

    await user.save();

    // Get updated wishlist with populated data
    const lang = req?.headers?.get("accept-language")?.split(",")[0] || "en";
    const updatedUser = await User.findOne({
      email: session.user.email,
    }).populate("wishlist");

    const items = (updatedUser?.wishlist || []).map((product: any) => {
      const localizedName =
        product.displayNames?.[lang] ||
        product.displayNames?.["zh-TW"] ||
        product.displayNames?.en ||
        product.name;
      return {
        ...product.toObject(),
        name: localizedName,
      };
    });

    return {
      items,
      success: true,
      action: isInWishlist ? "removed" : "added",
    };
  });
}

export async function DELETE(req: Request) {
  return handleWishlist(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("User not authenticated");
    }

    const { productId } = await req.json();
    if (!productId) {
      throw new Error("Product ID is required");
    }

    const user = await getOrCreateUser(session);

    // Remove from wishlist
    user.wishlist = user.wishlist.filter(
      (id: Types.ObjectId) => id.toString() !== productId
    );
    await user.save();

    // Get updated wishlist with populated data
    const lang = req?.headers?.get("accept-language")?.split(",")[0] || "en";
    const updatedUser = await User.findOne({
      email: session.user.email,
    }).populate("wishlist");

    const items = (updatedUser?.wishlist || []).map((product: any) => {
      const localizedName =
        product.displayNames?.[lang] ||
        product.displayNames?.["zh-TW"] ||
        product.displayNames?.en ||
        product.name;
      return {
        ...product.toObject(),
        name: localizedName,
      };
    });

    return {
      items,
      success: true,
      action: "removed",
    };
  });
}
