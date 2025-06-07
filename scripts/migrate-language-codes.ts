// @ts-nocheck
import mongoose from "mongoose";
import Brand from "../utils/models/Brand";
import dbConnect from "../utils/config/dbConnection";

async function migrateBrandLanguageCodes() {
  try {
    await dbConnect();
    console.log("Connected to database");

    const brands = await Brand.find({});
    console.log(`Found ${brands.length} brands to migrate`);

    for (const brand of brands) {
      // Check if the brand has zh instead of zh-TW
      if (
        brand.displayNames &&
        brand.displayNames["zh"] &&
        !brand.displayNames["zh-TW"]
      ) {
        console.log(`Migrating brand: ${brand.name}`);

        // Update displayNames
        const displayNames = {
          en: brand.displayNames.en || "",
          "zh-TW": brand.displayNames.zh || "",
        };

        // Update descriptions
        const descriptions = {
          en: brand.descriptions.en || "",
          "zh-TW": brand.descriptions.zh || "",
        };

        // Update the brand
        await Brand.findByIdAndUpdate(brand._id, {
          displayNames,
          descriptions,
        });

        console.log(`Successfully migrated brand: ${brand.name}`);
      }
    }

    console.log("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
migrateBrandLanguageCodes();
