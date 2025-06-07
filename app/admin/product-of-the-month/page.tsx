"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Metadata } from "next";
import { useTranslation } from "@/providers/language/LanguageContext";
import toast from "react-hot-toast";
import Image from "next/image";
import * as LucideIcons from "lucide-react";
import Link from "next/link";

interface Product {
  _id: string;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
}

interface Feature {
  icon: string;
  title: {
    en: string;
    "zh-TW": string;
  };
  description: {
    en: string;
    "zh-TW": string;
  };
}

export default function ProductOfTheMonthPage() {
  const { t, language } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [description, setDescription] = useState({ en: "", "zh-TW": "" });
  const [features, setFeatures] = useState<Feature[]>([
    {
      icon: "",
      title: { en: "", "zh-TW": "" },
      description: { en: "", "zh-TW": "" },
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [brokenIcons, setBrokenIcons] = useState<{ [key: number]: boolean }>(
    {}
  );

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch("/api/products/allProducts");
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data.products || data || []);
    } catch (error) {
      toast.error(t("product.productOfTheMonth.management.error"));
    }
  }, [t]);

  const fetchCurrentProductOfTheMonth = useCallback(async () => {
    try {
      const response = await fetch("/api/products/product-of-the-month");
      if (!response.ok) throw new Error("Failed to fetch current product");

      const { data, status } = await response.json();

      // Initialize empty state
      const emptyState = {
        selectedProduct: "",
        description: { en: "", "zh-TW": "" },
        features: [
          {
            icon: "",
            title: { en: "", "zh-TW": "" },
            description: { en: "", "zh-TW": "" },
          },
        ],
      };

      if (status === "success" && data) {
        // Product found, set the data
        setSelectedProduct(data._id);
        setDescription(
          data.productOfTheMonthDetails?.description || { en: "", "zh-TW": "" }
        );
        setFeatures(
          data.productOfTheMonthDetails?.features || [
            {
              icon: "",
              title: { en: "", "zh-TW": "" },
              description: { en: "", "zh-TW": "" },
            },
          ]
        );
      } else {
        // No product set, use empty state
        setSelectedProduct(emptyState.selectedProduct);
        setDescription(emptyState.description);
        setFeatures(emptyState.features);
      }
    } catch (error) {
      console.error("Error fetching product of the month:", error);
      // Reset to empty state on error
      setSelectedProduct("");
      setDescription({ en: "", "zh-TW": "" });
      setFeatures([
        {
          icon: "",
          title: { en: "", "zh-TW": "" },
          description: { en: "", "zh-TW": "" },
        },
      ]);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCurrentProductOfTheMonth();
  }, [fetchProducts, fetchCurrentProductOfTheMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    if (!description.en.trim() || !description["zh-TW"].trim()) {
      toast.error(
        t("product.productOfTheMonth.management.descriptionPlaceholder")
      );
      setIsLoading(false);
      return;
    }
    if (!features.length) {
      toast.error("Please add at least one feature.");
      setIsLoading(false);
      return;
    }
    for (const feature of features) {
      if (!feature.title.en.trim() || !feature.title["zh-TW"].trim()) {
        toast.error(t("product.productOfTheMonth.management.titlePlaceholder"));
        setIsLoading(false);
        return;
      }
      if (
        !feature.description.en.trim() ||
        !feature.description["zh-TW"].trim()
      ) {
        toast.error(
          t("product.productOfTheMonth.management.descriptionPlaceholder")
        );
        setIsLoading(false);
        return;
      }
    }
    try {
      const response = await fetch("/api/products/product-of-the-month", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct,
          description,
          features,
        }),
      });
      if (!response.ok)
        throw new Error("Failed to update product of the month");
      toast.success(t("product.productOfTheMonth.management.success"));
    } catch (error) {
      toast.error(t("product.productOfTheMonth.management.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeatureChange = (
    index: number,
    field: keyof Feature,
    value: any,
    lang?: "en" | "zh-TW"
  ) => {
    const newFeatures = [...features];
    if (field === "icon") {
      newFeatures[index].icon = value;
    } else if ((field === "title" || field === "description") && lang) {
      newFeatures[index][field][lang] = value;
    }
    setFeatures(newFeatures);
  };

  const addFeature = () => {
    setFeatures([
      ...features,
      {
        icon: "",
        title: { en: "", "zh-TW": "" },
        description: { en: "", "zh-TW": "" },
      },
    ]);
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const renderIcon = (icon: string) => {
    // Detect inline SVG string
    if (/^<svg[\s\S]*<\/svg>$/.test(icon.trim())) {
      // Make outline yellow, fill transparent
      const svg = icon
        .replace(/stroke="[^"]*"/g, 'stroke="currentColor"')
        .replace(/fill="[^"]*"/g, 'fill="none"');
      return (
        <span
          className="w-8 h-8 text-yellow-500"
          style={{ display: "inline-block" }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      );
    }
    if (/^(https?:\/\/|\/)/.test(icon)) {
      return (
        <Image
          src={icon}
          alt="icon preview"
          width={32}
          height={32}
          className="object-contain inline-block align-middle"
        />
      );
    }
    const LucideIcon = (LucideIcons as any)[icon];
    if (LucideIcon) {
      return (
        <LucideIcon
          className="w-8 h-8 text-yellow-500"
          color="currentColor"
          fill="currentColor"
        />
      );
    }
    return <span className="text-2xl text-yellow-500">{icon}</span>;
  };

  // Add a message when no products exist
  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">
          {t("product.productOfTheMonth.managementTitle")}
        </h1>
        <div className="p-6 border rounded-lg mb-4 text-center">
          <p className="text-muted-foreground mb-4">
            {t("product.noProductsAvailable")}
          </p>
          <Link
            href="/admin/products/new"
            className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            {t("product.addNewProduct")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">
        {t("product.productOfTheMonth.managementTitle")}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="p-6 border rounded-lg mb-4">
          <div className="mb-4">
            <label htmlFor="product" className="block font-medium mb-1">
              {t("product.productOfTheMonth.management.selectProduct")}
            </label>
            <select
              id="product"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">
                {t("product.productOfTheMonth.management.selectProduct")}
              </option>
              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.displayNames[language] || product.displayNames.en}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="description-en"
                className="block font-medium mb-1"
              >
                {t("product.productOfTheMonth.management.description")} (EN)
              </label>
              <textarea
                id="description-en"
                value={description.en}
                onChange={(e) =>
                  setDescription({ ...description, en: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                placeholder={t(
                  "product.productOfTheMonth.management.descriptionPlaceholder"
                )}
              />
            </div>
            <div>
              <label
                htmlFor="description-zh"
                className="block font-medium mb-1"
              >
                {t("product.productOfTheMonth.management.description")}{" "}
                (繁體中文)
              </label>
              <textarea
                id="description-zh"
                value={description["zh-TW"]}
                onChange={(e) =>
                  setDescription({ ...description, ["zh-TW"]: e.target.value })
                }
                className="w-full border rounded px-3 py-2"
                placeholder={t(
                  "product.productOfTheMonth.management.descriptionPlaceholder"
                )}
              />
            </div>
          </div>
        </div>
        <div className="p-6 border rounded-lg mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {t("product.productOfTheMonth.management.features")}
            </h3>
            <button
              type="button"
              onClick={addFeature}
              className="px-3 py-1 bg-blue-600 text-white rounded"
            >
              {t("product.productOfTheMonth.management.addFeature")}
            </button>
          </div>
          {features.map((feature, index) => (
            <div key={index} className="space-y-4 p-4 border rounded-lg mb-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">
                  {t("product.productOfTheMonth.management.feature")}{" "}
                  {index + 1}
                </h4>
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="px-2 py-1 bg-red-500 text-white rounded"
                >
                  {t("product.productOfTheMonth.management.removeFeature")}
                </button>
              </div>
              <div>
                <label className="block font-medium mb-1">
                  {t("product.productOfTheMonth.management.icon")}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={feature.icon}
                    onChange={(e) =>
                      handleFeatureChange(index, "icon", e.target.value)
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder={t(
                      "product.productOfTheMonth.management.iconPlaceholder"
                    )}
                  />
                  {/* Icon preview */}
                  <span className="ml-2 text-2xl">
                    {feature.icon && renderIcon(feature.icon)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">
                    {t("product.productOfTheMonth.management.title")} (EN)
                  </label>
                  <input
                    type="text"
                    value={feature.title.en || ""}
                    onChange={(e) =>
                      handleFeatureChange(index, "title", e.target.value, "en")
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder={t(
                      "product.productOfTheMonth.management.titlePlaceholder"
                    )}
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    {t("product.productOfTheMonth.management.title")} (繁體中文)
                  </label>
                  <input
                    type="text"
                    value={feature.title["zh-TW"] || ""}
                    onChange={(e) =>
                      handleFeatureChange(
                        index,
                        "title",
                        e.target.value,
                        "zh-TW"
                      )
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder={t(
                      "product.productOfTheMonth.management.titlePlaceholder"
                    )}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1">
                    {t("product.productOfTheMonth.management.description")} (EN)
                  </label>
                  <textarea
                    value={feature.description.en || ""}
                    onChange={(e) =>
                      handleFeatureChange(
                        index,
                        "description",
                        e.target.value,
                        "en"
                      )
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder={t(
                      "product.productOfTheMonth.management.descriptionPlaceholder"
                    )}
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1">
                    {t("product.productOfTheMonth.management.description")}{" "}
                    (繁體中文)
                  </label>
                  <textarea
                    value={feature.description["zh-TW"] || ""}
                    onChange={(e) =>
                      handleFeatureChange(
                        index,
                        "description",
                        e.target.value,
                        "zh-TW"
                      )
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder={t(
                      "product.productOfTheMonth.management.descriptionPlaceholder"
                    )}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-black text-white rounded"
        >
          {isLoading
            ? t("product.productOfTheMonth.management.saving")
            : t("product.productOfTheMonth.management.save")}
        </button>
      </form>
    </div>
  );
}
