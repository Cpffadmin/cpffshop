import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import dbConnect from "@/utils/config/dbConnection";
import Category from "@/utils/models/Category";

interface ApiError {
  message: string;
  code?: string;
}

// GET all categories
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.admin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 401 }
      );
    }

    await dbConnect();
    const categories = await Category.find().sort({ createdAt: -1 });

    return NextResponse.json({ categories });
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error("GET categories error:", apiError);
    return NextResponse.json(
      { error: apiError.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create new category
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.admin) {
      return NextResponse.json(
        { error: "Unauthorized: Admin access required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, displayNames, descriptions } = body;

    if (!displayNames?.en || !displayNames?.["zh-TW"]) {
      return NextResponse.json(
        { error: "Category names are required in both languages" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    // Check if category with same name or slug exists
    const existingCategory = await Category.findOne({
      $or: [
        { name },
        { slug },
        { "displayNames.en": displayNames.en },
        { "displayNames.zh-TW": displayNames["zh-TW"] },
      ],
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category with this name or slug already exists" },
        { status: 400 }
      );
    }

    const category = await Category.create({
      name,
      slug,
      displayNames,
      descriptions: descriptions || { en: "", "zh-TW": "" },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error("POST category error:", apiError);
    return NextResponse.json(
      { error: apiError.message || "Internal server error" },
      { status: 500 }
    );
  }
}
