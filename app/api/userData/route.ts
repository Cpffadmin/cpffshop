/* eslint-disable @typescript-eslint/no-explicit-any */
import User from "@/utils/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/auth.config";
import { createRouteHandler } from "@/utils/routeHandler";
import { Session } from "next-auth";

export const dynamic = "force-dynamic";

const handleUserData = createRouteHandler({ requireAuth: true });

// Helper function to get user name from session
function getUserNameFromSession(session: Session): string {
  const email = session.user?.email;
  if (!email) throw new Error("Email is required");

  return session.user?.name || email.split("@")[0];
}

export async function GET() {
  return handleUserData(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("User not found or not authenticated");
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
    if (!userObj.address) {
      userObj.address = {
        room: { en: "", "zh-TW": "" },
        floor: { en: "", "zh-TW": "" },
        building: { en: "", "zh-TW": "" },
        street: { en: "", "zh-TW": "" },
        city: { en: "", "zh-TW": "" },
        state: { en: "", "zh-TW": "" },
        country: { en: "", "zh-TW": "" },
        postalCode: { en: "", "zh-TW": "" },
        formattedAddress: { en: "", "zh-TW": "" },
      };
    }

    return userObj;
  });
}

export async function PATCH(request: Request) {
  return handleUserData(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("User not found or not authenticated");
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
          // Ensure these fields are set if this is a new user
          name: data.name || userName,
          email: session.user.email,
        },
      },
      {
        new: true,
        upsert: true, // Create if doesn't exist
        select: "-password",
      }
    );

    return user;
  });
}
