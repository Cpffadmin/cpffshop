import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { connectToDatabase } from "@/utils/database";
import Category from "@/utils/models/Category";

const SPEC_TRANSLATIONS: Record<string, { en: string; "zh-TW": string }> = {
  manufactury_country: {
    en: "Manufacturing Country",
    "zh-TW": "製造國",
  },
  origin: {
    en: "Country of Origin",
    "zh-TW": "原產地",
  },
  material: {
    en: "Material",
    "zh-TW": "材質",
  },
  weight: {
    en: "Weight",
    "zh-TW": "重量",
  },
  size: {
    en: "Size",
    "zh-TW": "尺寸",
  },
} as const;

export async function POST() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    await connectToDatabase();

    // Get all categories
    const categories = await Category.find({});

    // Update each category's specifications
    for (const category of categories) {
      if (category.specifications) {
        const updatedSpecs = category.specifications.map(
          (spec: {
            key: string;
            displayNames?: { en: string; "zh-TW": string };
            label?: string;
          }) => {
            // If we have a translation for this key, use it
            if (SPEC_TRANSLATIONS[spec.key]) {
              return {
                ...spec,
                displayNames: SPEC_TRANSLATIONS[spec.key],
                label: SPEC_TRANSLATIONS[spec.key].en,
              };
            }

            // Otherwise, generate display names from the key
            const formattedLabel = spec.key
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");

            return {
              ...spec,
              displayNames: {
                en: spec.displayNames?.en || formattedLabel,
                "zh-TW": spec.displayNames?.["zh-TW"] || formattedLabel,
              },
              label: spec.label || formattedLabel,
            };
          }
        );

        // Update the category
        await Category.findByIdAndUpdate(category._id, {
          $set: { specifications: updatedSpecs },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Specifications translations updated successfully",
    });
  } catch (error) {
    console.error("Error updating specification translations:", error);
    return NextResponse.json(
      { error: "Failed to update specification translations" },
      { status: 500 }
    );
  }
}
