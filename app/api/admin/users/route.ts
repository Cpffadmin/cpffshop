import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import User from "@/utils/models/User";
import { createRouteHandler } from "@/utils/routeHandler";
import bcryptjs from "bcryptjs";

export const dynamic = "force-dynamic";

const handleAdminRoute = createRouteHandler({ requireAdmin: true });

export async function GET() {
  return handleAdminRoute(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      throw new Error("Unauthorized");
    }
    const users = await User.find({}).select("-password");
    return { users };
  });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const {
      name,
      email,
      password,
      role = "user",
      admin = false,
    } = await request.json();

    // Validate required fields
    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return new Response(JSON.stringify({ error: "User already exists" }), {
        status: 409,
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      admin,
    });

    // Remove password from response
    const userWithoutPassword = user.toObject();
    delete userWithoutPassword.password;

    return new Response(
      JSON.stringify({
        message: "User created successfully",
        user: userWithoutPassword,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return new Response(JSON.stringify({ error: "Failed to create user" }), {
      status: 500,
    });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { userId, role, admin } = await request.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role, admin },
      { new: true }
    ).select("-password");

    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    return new Response(JSON.stringify(user), { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return new Response(JSON.stringify({ error: "Failed to update user" }), {
      status: 500,
    });
  }
}
