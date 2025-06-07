import { NextResponse } from "next/server";
import { connectToDatabase } from "@/utils/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { FeaturesSection } from "@/models/FeaturesSection";

// GET features section
export async function GET() {
  try {
    await connectToDatabase();
    const featuresSection = await FeaturesSection.findOne({});
    return NextResponse.json({
      title: featuresSection?.title || { en: "", "zh-TW": "" },
      items: featuresSection?.items || [],
    });
  } catch (error) {
    console.error("Error fetching features section:", error);
    return NextResponse.json(
      { error: "Failed to fetch features section" },
      { status: 500 }
    );
  }
}

// POST features section
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { items, title } = await request.json();
    await connectToDatabase();
    let featuresSection = await FeaturesSection.findOne({});
    if (!featuresSection) {
      featuresSection = new FeaturesSection({ items, title });
    } else {
      featuresSection.items = items;
      featuresSection.title = title;
    }
    await featuresSection.save();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating features section:", error);
    return NextResponse.json(
      { error: "Failed to update features section" },
      { status: 500 }
    );
  }
}
