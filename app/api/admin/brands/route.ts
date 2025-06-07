import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/auth.config";
import Brand, { IBrand } from "@/utils/models/Brand";
import BrandBeta from "@/utils/models/BrandBeta";
import { BrandSyncManager } from "@/utils/brandSync";
import { shouldShowBrandAdmin } from "@/utils/config/featureFlags";
import mongoose, { Model } from "mongoose";
import dbConnect from "@/utils/config/dbConnection";

interface ErrorResponse {
  error: string;
  details?: unknown;
}

export async function GET() {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!shouldShowBrandAdmin()) {
      return NextResponse.json(
        { error: "Feature not enabled" },
        { status: 403 }
      );
    }

    // Try to get brands from the new model first
    let brands = await Brand.find().sort({ order: 1 });

    // If no brands found in new model, try the beta model
    if (!brands || brands.length === 0) {
      brands = await BrandBeta.find().sort({ order: 1 });
    }

    const syncStatus = await BrandSyncManager.verifySyncStatus();

    return NextResponse.json({
      brands,
      syncStatus,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/brands:", error);
    const errorResponse: ErrorResponse = {
      error: "Failed to fetch brands",
    };
    if (error instanceof Error) {
      errorResponse.details = error.message;
    }
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!shouldShowBrandAdmin()) {
      return NextResponse.json(
        { error: "Feature not enabled" },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { action, ...brandData } = data;

    if (action === "sync") {
      const results = await BrandSyncManager.syncDefaultBrands();
      return NextResponse.json({
        message: "Brands synced successfully",
        results,
      });
    }

    if (action === "create") {
      const existingBrand = await Brand.findOne({
        $or: [{ name: brandData.name }, { displayName: brandData.displayName }],
      });

      if (existingBrand) {
        return NextResponse.json(
          { error: "Brand with this name already exists" },
          { status: 400 }
        );
      }

      const slug = brandData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const brand = await Brand.create({
        name: brandData.name,
        slug,
        displayNames: brandData.displayNames,
        descriptions: brandData.descriptions,
        isActive: brandData.isActive,
        legacyBrandName: brandData.name,
        icon: "Watch",
        order: (await Brand.countDocuments()) + 1,
      });

      return NextResponse.json({ brand });
    }

    return NextResponse.json(
      { error: "Invalid action specified" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in POST /api/admin/brands:", error);
    const errorResponse: ErrorResponse = {
      error: "Failed to process brand action",
    };
    if (error instanceof Error) {
      errorResponse.details = error.message;
    }
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!shouldShowBrandAdmin()) {
      return NextResponse.json(
        { error: "Feature not enabled" },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { id, ...updateData } = data;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid brand ID format" },
        { status: 400 }
      );
    }

    // Ensure displayNames and descriptions are properly structured
    const sanitizedUpdateData = {
      ...updateData,
      displayNames: {
        en: updateData.displayNames?.en || "",
        "zh-TW": updateData.displayNames?.["zh-TW"] || "",
      },
      descriptions: {
        en: updateData.descriptions?.en || "",
        "zh-TW": updateData.descriptions?.["zh-TW"] || "",
      },
    };

    // Try to update in both models
    let brand = await Brand.findByIdAndUpdate(id, sanitizedUpdateData, {
      new: true,
    });
    if (!brand) {
      brand = await BrandBeta.findByIdAndUpdate(id, sanitizedUpdateData, {
        new: true,
      });
    }

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json({ brand });
  } catch (error) {
    console.error("Error in PATCH /api/admin/brands:", error);
    const errorResponse: ErrorResponse = {
      error: "Failed to update brand",
    };
    if (error instanceof Error) {
      errorResponse.details = error.message;
    }
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);
    if (!session?.user?.admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!shouldShowBrandAdmin()) {
      return NextResponse.json(
        { error: "Feature not enabled" },
        { status: 403 }
      );
    }

    const data = await request.json();
    const { id } = data;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid brand ID format" },
        { status: 400 }
      );
    }

    // Try to find brand in both models
    let brand = await Brand.findById(id);
    if (!brand) {
      brand = await BrandBeta.findById(id);
    }

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (brand.isDefault && brand.name.toLowerCase() !== "all brands") {
      return NextResponse.json(
        { error: "Cannot delete default brand" },
        { status: 400 }
      );
    }

    // Delete from both models if exists
    await Promise.all([
      Brand.findByIdAndDelete(id),
      BrandBeta.findByIdAndDelete(id),
    ]);

    // Reorder remaining brands in both models
    const reorderBrands = async (Model: Model<IBrand>) => {
      const remainingBrands = await Model.find().sort({ order: 1 });
      await Promise.all(
        remainingBrands.map((brand, index) =>
          Model.findByIdAndUpdate(brand._id, { order: index })
        )
      );
    };

    await Promise.all([reorderBrands(Brand), reorderBrands(BrandBeta)]);

    return NextResponse.json({ message: "Brand deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/admin/brands:", error);
    const errorResponse: ErrorResponse = {
      error: "Failed to delete brand",
    };
    if (error instanceof Error) {
      errorResponse.details = error.message;
    }
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
