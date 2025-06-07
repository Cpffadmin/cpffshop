"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  CldUploadButton,
  CloudinaryUploadWidgetResults,
} from "next-cloudinary";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { Specification } from "@/types";
import { MultiLangInput } from "@/components/MultiLangInput";
import { useTranslation } from "@/providers/language/LanguageContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { mutate } from "swr";

interface Brand {
  _id: string;
  name: string;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  descriptions: {
    en: string;
    "zh-TW": string;
  };
  isActive: boolean;
}

interface Category {
  _id: string;
  name: string;
  displayNames?: {
    en: string;
    "zh-TW": string;
  };
  description?: string;
  specifications?: Specification[];
}

interface ProductData {
  user?: string;
  name: string;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  description: string;
  descriptions: {
    en: string;
    "zh-TW": string;
  };
  brand: string | Brand;
  images: string[];
  price: number;
  netPrice: number;
  originalPrice: number;
  stock: number;
  category: string | Category;
  specifications: Array<{
    key: string;
    value: {
      en: string;
      "zh-TW": string;
    };
    type: "text" | "number" | "select";
    displayNames?: {
      en: string;
      "zh-TW": string;
    };
    description?: string;
    options?: string[];
    required?: boolean;
  }>;
  draft: boolean;
  isBestSelling: boolean;
}

const CreateProduct = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { language } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [product, setProduct] = useState<ProductData>({
    user: session?.user?._id,
    name: "",
    displayNames: {
      en: "",
      "zh-TW": "",
    },
    description: "",
    descriptions: {
      en: "",
      "zh-TW": "",
    },
    brand: "",
    images: [],
    price: 0,
    netPrice: 0,
    originalPrice: 0,
    stock: 0,
    category: "",
    specifications: [],
    draft: false,
    isBestSelling: false,
  });

  // Fetch categories and brands on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [categoriesRes, brandsRes] = await Promise.all([
          axios.get("/api/categories"),
          axios.get("/api/brands"),
        ]);

        if (categoriesRes.data.categories) {
          setCategories(categoriesRes.data.categories);
        } else {
          toast.error(
            language === "en"
              ? "Invalid category data received"
              : "收到無效的類別數據"
          );
        }

        if (brandsRes.data.brands) {
          setBrands(brandsRes.data.brands);
        } else {
          toast.error(
            language === "en"
              ? "Invalid brand data received"
              : "收到無效的品牌數據"
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error instanceof AxiosError) {
          toast.error(
            error.response?.data?.error ||
              (language === "en" ? "Failed to load data" : "加載數據失敗")
          );
        } else {
          toast.error(
            language === "en" ? "Failed to load data" : "加載數據失敗"
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (session?.user?.admin) {
      fetchData();
    }
  }, [session, language]);

  // Update specifications when category changes
  useEffect(() => {
    if (selectedCategory) {
      const initialSpecs =
        selectedCategory.specifications?.map((spec) => ({
          key: spec.key || spec.label.toLowerCase().replace(/\s+/g, "_"),
          value: {
            en: spec.type === "number" ? "0" : "",
            "zh-TW": spec.type === "number" ? "0" : "",
          },
          type: spec.type,
          displayNames: spec.displayNames,
          options: spec.options,
          required: spec.required,
        })) || [];

      setProduct((prev) => ({
        ...prev,
        category: selectedCategory._id,
        specifications: initialSpecs,
      }));
    }
  }, [selectedCategory]);

  // Redirect if not admin
  useEffect(() => {
    if (status === "authenticated" && !session?.user?.admin) {
      toast.error("Unauthorized: Admin access required");
      router.push("/");
    }
  }, [session, status, router]);

  // Show loading or unauthorized for non-admins
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (status === "authenticated" && !session?.user?.admin) {
    return null; // Will redirect in useEffect
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setProduct((prevState) => ({
      ...prevState,
      [name]:
        name === "price" || name === "originalPrice" || name === "stock"
          ? Number(value)
          : value,
    }));
  };

  const handleSpecificationChange = (
    key: string,
    value: string | number | { en: string; "zh-TW": string }
  ) => {
    setProduct((prev) => {
      const updatedSpecs = prev.specifications.map((spec) => {
        if (spec.key === key) {
          // Convert number or string to multilingual format if needed
          const multilangValue =
            typeof value === "object"
              ? value
              : { en: String(value), "zh-TW": String(value) };
          return { ...spec, value: multilangValue };
        }
        return spec;
      });
      return { ...prev, specifications: updatedSpecs };
    });
  };

  const handleUpload = (result: CloudinaryUploadWidgetResults) => {
    if (
      result.info &&
      typeof result.info === "object" &&
      "secure_url" in result.info
    ) {
      const url = result.info.secure_url as string;
      setImageUrls((prev) => [...prev, url]);
      setProduct((prev) => ({
        ...prev,
        images: [...prev.images, url],
      }));
    }
  };

  const handleRemoveImage = (e: React.MouseEvent, urlToRemove: string) => {
    e.preventDefault();
    setImageUrls((prev) => prev.filter((url) => url !== urlToRemove));
    setProduct((prev) => ({
      ...prev,
      images: prev.images.filter((url) => url !== urlToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await axios.post("/api/products", product);
      if (response.data) {
        toast.success(
          language === "en" ? "Product created successfully" : "產品創建成功"
        );
        router.refresh();
        router.push("/admin/products");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      if (error instanceof AxiosError) {
        console.error("Server error details:", error.response?.data);
        toast.error(
          error.response?.data?.error ||
            (language === "en" ? "Failed to create product" : "創建產品失敗")
        );
      } else {
        toast.error(
          language === "en" ? "Failed to create product" : "創建產品失敗"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">
        {language === "en" ? "Create Product" : "創建產品"}
      </h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-[#1a1f2c] rounded-lg p-8"
      >
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <MultiLangInput
              label={language === "en" ? "Product Name" : "產品名稱"}
              value={product.displayNames}
              onChange={(value) =>
                setProduct((prev) => ({
                  ...prev,
                  displayNames: value,
                  name: value.en,
                }))
              }
              placeholder={{
                en: "Enter product name in English",
                "zh-TW": "輸入產品中文名稱",
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === "en" ? "Brand" : "品牌"}
            </label>
            <select
              name="brand"
              value={
                typeof product.brand === "object"
                  ? product.brand._id
                  : product.brand
              }
              onChange={handleChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            >
              <option value="">
                {language === "en" ? "Select a brand" : "選擇品牌"}
              </option>
              {brands.map((brand) => (
                <option key={brand._id} value={brand._id}>
                  {brand.displayNames[language] || brand.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === "en" ? "Category" : "類別"}
            </label>
            <select
              name="category"
              value={
                typeof product.category === "object"
                  ? product.category._id
                  : product.category
              }
              onChange={(e) => {
                const category = categories.find(
                  (c) => c._id === e.target.value
                );
                setSelectedCategory(category || null);
                handleChange(e);
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              required
            >
              <option value="">
                {language === "en" ? "Select a category" : "選擇類別"}
              </option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.displayNames?.[language] || category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <MultiLangInput
              label={language === "en" ? "Description" : "描述"}
              value={product.descriptions}
              onChange={(value) =>
                setProduct((prev) => ({
                  ...prev,
                  descriptions: value,
                  description: value.en,
                }))
              }
              placeholder={{
                en: "Enter product description in English",
                "zh-TW": "輸入產品中文描述",
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === "en" ? "Product Images" : "產品圖片"}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <Image
                    src={url}
                    alt={`${language === "en" ? "Product image" : "產品圖片"} ${
                      index + 1
                    }`}
                    width={200}
                    height={200}
                    className="rounded-md object-cover"
                  />
                  <button
                    type="button"
                    onClick={(e) => handleRemoveImage(e, url)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
              <CldUploadButton
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME}
                onSuccess={handleUpload}
                options={{
                  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                  maxFiles: 5,
                  sources: ["local", "url", "camera"],
                  clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
                  maxFileSize: 10000000,
                  multiple: true,
                }}
              >
                <div className="flex items-center justify-center w-full h-32 border border-dashed rounded-lg cursor-pointer">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      {language === "en"
                        ? "Click to upload or drag and drop"
                        : "點擊上傳或拖放"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {language === "en"
                        ? "PNG, JPG, JPEG or WEBP (MAX. 10MB)"
                        : "PNG、JPG、JPEG 或 WEBP（最大 10MB）"}
                    </p>
                  </div>
                </div>
              </CldUploadButton>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === "en" ? "Net Price" : "淨價"}
              </label>
              <Input
                type="number"
                name="netPrice"
                value={product.netPrice}
                onChange={handleChange}
                onFocus={(e) => e.target.select()}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === "en" ? "Price" : "售價"}
              </label>
              <Input
                type="number"
                name="price"
                value={product.price}
                onChange={handleChange}
                onFocus={(e) => e.target.select()}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === "en" ? "Original Price" : "原價"}
              </label>
              <Input
                type="number"
                name="originalPrice"
                value={product.originalPrice}
                onChange={handleChange}
                onFocus={(e) => e.target.select()}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === "en" ? "Stock" : "庫存"}
            </label>
            <Input
              type="number"
              name="stock"
              value={product.stock}
              onChange={handleChange}
              onFocus={(e) => e.target.select()}
              min="0"
              required
            />
          </div>

          {selectedCategory?.specifications &&
            selectedCategory.specifications.length > 0 && (
              <div className="space-y-4">
                <label className="text-sm font-medium">
                  {language === "en" ? "Specifications" : "規格"}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedCategory.specifications.map((spec) => (
                    <div key={spec.key || spec.label} className="space-y-2">
                      <label className="text-sm font-medium">
                        {spec.displayNames?.[language] || spec.label}
                      </label>
                      {spec.type === "select" ? (
                        <select
                          value={String(
                            product.specifications.find(
                              (s) =>
                                s.key ===
                                (spec.key ||
                                  spec.label.toLowerCase().replace(/\s+/g, "_"))
                            )?.value || ""
                          )}
                          onChange={(e) =>
                            handleSpecificationChange(
                              spec.key ||
                                spec.label.toLowerCase().replace(/\s+/g, "_"),
                              e.target.value
                            )
                          }
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          required={spec.required}
                        >
                          <option value="">
                            {language === "en"
                              ? `Select ${spec.displayNames?.en || spec.label}`
                              : `選擇${
                                  spec.displayNames?.["zh-TW"] || spec.label
                                }`}
                          </option>
                          {spec.options?.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : spec.type === "number" ? (
                        <Input
                          type="number"
                          value={String(
                            product.specifications.find(
                              (s) =>
                                s.key ===
                                (spec.key ||
                                  spec.label.toLowerCase().replace(/\s+/g, "_"))
                            )?.value || ""
                          )}
                          onChange={(e) =>
                            handleSpecificationChange(
                              spec.key ||
                                spec.label.toLowerCase().replace(/\s+/g, "_"),
                              Number(e.target.value)
                            )
                          }
                          onFocus={(e) => e.target.select()}
                          placeholder={
                            language === "en"
                              ? `Enter ${spec.displayNames?.en || spec.label}`
                              : `輸入${
                                  spec.displayNames?.["zh-TW"] || spec.label
                                }`
                          }
                          required={spec.required}
                        />
                      ) : (
                        <MultiLangInput
                          value={
                            (product.specifications.find(
                              (s) =>
                                s.key ===
                                (spec.key ||
                                  spec.label.toLowerCase().replace(/\s+/g, "_"))
                            )?.value as { en: string; "zh-TW": string }) || {
                              en: "",
                              "zh-TW": "",
                            }
                          }
                          onChange={(value) =>
                            handleSpecificationChange(
                              spec.key ||
                                spec.label.toLowerCase().replace(/\s+/g, "_"),
                              value
                            )
                          }
                          placeholder={{
                            en: `Enter ${spec.displayNames?.en || spec.label}`,
                            "zh-TW": `輸入${
                              spec.displayNames?.["zh-TW"] || spec.label
                            }`,
                          }}
                          required={spec.required}
                        />
                      )}
                      {spec.description && (
                        <p className="text-sm text-muted-foreground">
                          {spec.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          <div className="flex items-center space-x-2">
            <Switch
              id="draft"
              checked={product.draft}
              onCheckedChange={(checked) =>
                setProduct((prev) => ({ ...prev, draft: checked }))
              }
            />
            <Label htmlFor="draft" className="text-sm font-medium">
              {language === "en" ? "Save as Draft" : "保存為草稿"}
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isBestSelling"
              checked={product.isBestSelling}
              onCheckedChange={(checked) =>
                setProduct((prev) => ({ ...prev, isBestSelling: checked }))
              }
            />
            <Label htmlFor="isBestSelling">
              {language === "en" ? "Best Selling Product" : "暢銷產品"}
            </Label>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoading
                ? language === "en"
                  ? "Creating..."
                  : "創建中..."
                : language === "en"
                ? "Create Product"
                : "創建產品"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateProduct;
