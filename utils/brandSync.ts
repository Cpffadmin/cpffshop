import Brand from "./models/Brand";

// Define brand translations
interface BrandTranslation {
  en: string;
  "zh-TW": string;
}

export class BrandSyncManager {
  // Convert brand name to slug
  private static createSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  // Update a single brand's language codes
  private static async updateBrandLanguages(brand: any) {
    try {
      if (brand.displayNames?.zh && !brand.displayNames["zh-TW"]) {
        await Brand.findByIdAndUpdate(brand._id, {
          displayNames: {
            en: brand.displayNames.en || "",
            "zh-TW": brand.displayNames.zh || "",
          },
          descriptions: {
            en: brand.descriptions?.en || "",
            "zh-TW": brand.descriptions?.zh || "",
          },
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error updating brand ${brand.name}:`, error);
      return false;
    }
  }

  // Sync all brands' language codes
  static async syncDefaultBrands() {
    try {
      // Update any existing brands with wrong language codes
      const existingBrands = await Brand.find({});
      const updateResults = await Promise.all(
        existingBrands.map((brand) => this.updateBrandLanguages(brand))
      );

      const updatedCount = updateResults.filter(Boolean).length;
      console.log(`Successfully updated ${updatedCount} brands`);
      return existingBrands;
    } catch (error) {
      console.error("Error syncing brands:", error);
      throw error;
    }
  }

  // Get brand mapping (old name to new id)
  static async getBrandMapping(): Promise<Record<string, string>> {
    const brands = await Brand.find({});
    return brands.reduce((acc, brand) => {
      acc[brand.legacyBrandName || brand.name] = brand._id.toString();
      return acc;
    }, {} as Record<string, string>);
  }

  // Verify sync status
  static async verifySyncStatus() {
    const brands = await Brand.find({});
    const brandsWithOldCodes = brands.filter(
      (brand) => brand.displayNames?.zh && !brand.displayNames["zh-TW"]
    );

    return {
      totalBrands: brands.length,
      needsUpdate: brandsWithOldCodes.length > 0,
      brandsToUpdate: brandsWithOldCodes.length,
    };
  }
}
