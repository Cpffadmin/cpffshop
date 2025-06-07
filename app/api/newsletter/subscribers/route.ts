export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { connectToDatabase } from "@/utils/database";
import Newsletter from "@/utils/models/Newsletter";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.admin) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const subscribers = await Newsletter.find()
      .sort({ subscribedAt: -1 })
      .lean();

    return NextResponse.json(subscribers);
  } catch (error) {
    console.error("Failed to fetch subscribers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
