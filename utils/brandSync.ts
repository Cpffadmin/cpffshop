import Brand from "./models/Brand";

// Define brand translations
interface BrandTranslation {
  en: string;
  "zh-TW": string;
}

const DEFAULT_BRANDS: Record<string, BrandTranslation> = {
  Rolex: {
    en: "Rolex",
    "zh-TW": "勞力士",
  },
  "Patek Philippe": {
    en: "Patek Philippe",
    "zh-TW": "百達翡麗",
  },
  "Audemars Piguet": {
    en: "Audemars Piguet",
    "zh-TW": "愛彼",
  },
  "Richard Mille": {
    en: "Richard Mille",
    "zh-TW": "理查德·米勒",
  },
  Omega: {
    en: "Omega",
    "zh-TW": "歐米茄",
  },
  IWC: {
    en: "IWC",
    "zh-TW": "萬國錶",
  },
  Cartier: {
    en: "Cartier",
    "zh-TW": "卡地亞",
  },
  Tudor: {
    en: "Tudor",
    "zh-TW": "帝舵",
  },
};

export class BrandSyncManager {
  // Convert brand name to slug
  private static createSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }

  // Create a single brand
  private static async createBrand(
    brandName: string,
    translations: BrandTranslation,
    order: number
  ) {
    try {
      const existingBrand = await Brand.findOne({
        legacyBrandName: brandName,
      });

      if (existingBrand) {
        // Update existing brand with correct language codes
        await Brand.findByIdAndUpdate(existingBrand._id, {
          displayNames: {
            en: translations.en,
            "zh-TW": translations["zh-TW"],
          },
          descriptions: {
            en: existingBrand.descriptions?.en || "",
            "zh-TW":
              existingBrand.descriptions?.["zh-TW"] ||
              existingBrand.descriptions?.zh ||
              "",
          },
        });
        return existingBrand;
      }

      return await Brand.create({
        name: brandName,
        slug: this.createSlug(brandName),
        displayNames: {
          en: translations.en,
          "zh-TW": translations["zh-TW"],
        },
        descriptions: {
          en: "",
          "zh-TW": "",
        },
        isActive: true,
        order,
        legacyBrandName: brandName,
      });
    } catch (error) {
      console.error(`Error creating brand ${brandName}:`, error);
      throw error;
    }
  }

  // Sync all default brands
  static async syncDefaultBrands() {
    try {
      // First, update any existing brands with wrong language codes
      const existingBrands = await Brand.find({});
      for (const brand of existingBrands) {
        if (brand.displayNames?.zh && !brand.displayNames["zh-TW"]) {
          await Brand.findByIdAndUpdate(brand._id, {
            displayNames: {
              en: brand.displayNames.en,
              "zh-TW": brand.displayNames.zh,
            },
            descriptions: {
              en: brand.descriptions?.en || "",
              "zh-TW": brand.descriptions?.zh || "",
            },
          });
        }
      }

      // Then sync all default brands
      const results = await Promise.all(
        Object.entries(DEFAULT_BRANDS).map(([brandName, translations], index) =>
          this.createBrand(brandName, translations, index)
        )
      );

      console.log(`Successfully synced ${results.length} brands`);
      return results;
    } catch (error) {
      console.error("Error syncing default brands:", error);
      throw error;
    }
  }

  // Get brand mapping (old name to new id)
  static async getBrandMapping(): Promise<Record<string, string>> {
    const brands = await Brand.find({});
    return brands.reduce((acc, brand) => {
      acc[brand.legacyBrandName] = brand._id.toString();
      return acc;
    }, {} as Record<string, string>);
  }

  // Verify sync status
  static async verifySyncStatus() {
    const brands = await Brand.find({});
    const missingBrands = Object.keys(DEFAULT_BRANDS).filter(
      (brandName) => !brands.some((b) => b.legacyBrandName === brandName)
    );

    return {
      totalBrands: brands.length,
      missingBrands,
      isSynced: missingBrands.length === 0,
    };
  }
}
