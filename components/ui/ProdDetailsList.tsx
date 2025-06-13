import React from "react";
import { Product } from "@/types";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useSession } from "next-auth/react";

// Simple mapping for specification titles
const SPEC_TITLES: Record<string, { en: string; "zh-TW": string }> = {
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
  color: {
    en: "Color",
    "zh-TW": "顏色",
  },
};

interface Props {
  product: Product;
}

const ProdDetailsList = ({ product }: Props) => {
  const { language, t } = useTranslation();
  const { data: session } = useSession();

  console.log("ProdDetailsList rendering with language:", language);
  console.log("Product data:", product);

  // Convert specifications to array format if it's an object
  const specifications = React.useMemo(() => {
    if (!product.specifications) return [];

    if (Array.isArray(product.specifications)) {
      return product.specifications;
    }

    // Convert object format to array format
    return Object.entries(product.specifications).map(([key, value]) => ({
      key,
      value,
      displayNames: SPEC_TITLES[key as keyof typeof SPEC_TITLES] || {
        en: key
          .split("_")
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        "zh-TW": key
          .split("_")
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
      },
    }));
  }, [product.specifications]);

  console.log("Processed specifications:", specifications);

  return (
    <div
      className="bg-card rounded-lg p-1 mt-0"
      key={`prod-details-${language}`}
    >
      <h3 className="text-2xl font-bold mb-4 text-foreground">
        {t("product.details")}
      </h3>
      <div className="space-y-4">
        {/* First Line */}
        <div className="grid grid-cols-3 gap-4">
          {/*Category*/}
          {product.category && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                {t("product.category.label")}
              </h4>
              <p className="text-foreground">
                {product.category.displayNames?.[language] ||
                  product.category.name}
              </p>
            </div>
          )}

          {/* Brand */}
          {product.brand && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                {t("product.brand.label")}
              </h4>
              <p className="text-foreground">
                {product.brand.displayNames?.[language] || product.brand.name}
              </p>
            </div>
          )}

          
        </div>

        {/* Stock - Only visible to admin */}
        {session?.user?.admin && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-1">
                {t("product.stock")}
              </h4>
              <p className="text-foreground">
                {product.stock} {t("product.inStock")}
              </p>
            </div>
          )}

        {/* Second Line */}
        <div className="grid grid-cols-3 gap-4">
          {/* Featured Status */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-1">
              {t("product.featured")}
            </h4>
            <p className="text-foreground">
              {product.featured ? t("common.yes") : t("common.no")}
            </p>
          </div>

          {/* Listed Date */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-1">
              {t("product.listedDate")}
            </h4>
            <p className="text-foreground">
              {new Date(product.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Specifications */}
      {specifications.length > 0 && (
        <div className="mt-4">
          <h4 className="text-lg font-semibold mb-2">
            {t("product.specifications")}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {specifications.map((spec) => (
              <div
                key={`${spec.key}-${language}`}
                className="border-b border-border pb-2"
              >
                <h5 className="text-sm font-semibold text-muted-foreground mb-1">
                  {SPEC_TITLES[spec.key as keyof typeof SPEC_TITLES]?.[
                    language
                  ] ||
                    spec.key
                      .split("_")
                      .map(
                        (word: string) =>
                          word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
                </h5>
                <p className="text-foreground">
                  {typeof spec.value === "object" && spec.value !== null
                    ? spec.value?.[language] || Object.values(spec.value)[0]
                    : String(spec.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="mt-8">
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
          {t("product.description")}
        </h4>
        <p className="text-foreground whitespace-pre-wrap">
          {product.descriptions?.[language] || // First try descriptions object
            product.description || // Then fallback to plain description
            t("common.noDescription")}
        </p>
      </div>
    </div>
  );
};

// Force re-render when component updates
export default React.memo(ProdDetailsList, (prevProps, nextProps) => {
  return (
    JSON.stringify(prevProps.product) === JSON.stringify(nextProps.product)
  );
});
