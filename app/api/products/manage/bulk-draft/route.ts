import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { connectToDatabase, waitForConnection } from "@/utils/database";
import Product from "@/utils/models/Product";
import { clearAllProductCaches } from "@/utils/cache";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const isConnected = await waitForConnection(10000);
    if (!isConnected) {
      return NextResponse.json(
        { error: "Database connection timeout" },
        { status: 503 }
      );
    }

    const body = await request.json();
    if (body.draft !== false) {
      return NextResponse.json(
        { error: "Only activating drafts (draft: false) is supported" },
        { status: 400 }
      );
    }

    const result = await Product.updateMany(
      { draft: true },
      { $set: { draft: false } }
    );

    clearAllProductCaches();
    return NextResponse.json({
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error activating draft products:", error);
    return NextResponse.json(
      { error: "Failed to activate draft products" },
      { status: 500 }
    );
  }
}
