"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/providers/language/LanguageContext";
import toast from "react-hot-toast";
import Image from "next/image";
import * as LucideIcons from "lucide-react";

interface FeatureItem {
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

const getIcon = (iconName: string) => {
  // Inline SVG
  if (iconName && /^<svg[\s\S]*<\/svg>$/.test(iconName.trim())) {
    let svg = iconName
      .replace(/stroke="[^"]*"/g, 'stroke="currentColor"')
      .replace(/fill="[^"]*"/g, 'fill="none"');
    svg = svg.replace(/width="[^"]*"/g, "").replace(/height="[^"]*"/g, "");
    return (
      <span
        className=" flex items-center justify-center w-full h-full"
        style={{ display: "inline-flex" }}
      >
        <span
          className="text-yellow-500 max-w-[55%] max-h-[55%] w-full h-full"
          style={{ display: "inline-block" }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </span>
    );
  }
  // URL or path
  if (iconName && /^(https?:\/\/|\/)/.test(iconName)) {
    return (
      <Image
        src={iconName}
        alt="icon"
        width={80}
        height={80}
        className="object-contain w-full h-full"
      />
    );
  }
  // Lucide icon
  const LucideIcon = (LucideIcons as any)[iconName];
  if (LucideIcon) {
    return <LucideIcon className="w-full h-full text-yellow-500" />;
  }
  // Default images
  switch (iconName) {
    case "satisfied":
    case "quality":
    case "swiss":
      return (
        <Image
          src="/placeholder.png"
          alt={iconName}
          width={80}
          height={80}
          className="object-contain w-full h-full"
        />
      );
    default:
      return (
        <Image
          src="/placeholder.png"
          alt="icon"
          width={80}
          height={80}
          className="object-contain w-full h-full"
        />
      );
  }
};

const FeaturesSection = () => {
  const { t, language } = useTranslation();
  const [items, setItems] = useState<FeatureItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState<{ en: string; "zh-TW": string }>({
    en: "",
    "zh-TW": "",
  });

  const fetchFeaturesSection = useCallback(async () => {
    try {
      const response = await fetch("/api/features-section", {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to fetch features section");
      const data = await response.json();
      if (data.items) {
        setItems(data.items);
      }
      if (data.title) {
        setTitle(data.title);
      }
    } catch (error) {
      console.error("Error fetching features section:", error);
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchFeaturesSection();
  }, [fetchFeaturesSection]);

  // Always render 3 cards, fallback to default if missing
  const cards = [0, 1, 2].map((i) => {
    const item = items[i];
    return (
      <div
        key={i}
        className="flex flex-col items-center justify-center text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/20 transform transition-all duration-500 hover:scale-105 hover:shadow-xl dark:hover:shadow-gray-900/40"
        style={{ minWidth: 220 }}
      >
        <div
          className="mb-4 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-full transition-colors"
          style={{ width: 100, height: 100 }}
        >
          {getIcon(item?.icon)}
        </div>
        <h3 className="text-2xl xl:text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 transition-colors break-words overflow-hidden text-ellipsis line-clamp-2">
          {item?.title?.[language] ||
            [
              "SATISFIED OR REFUNDED",
              "BASED IN SWITZERLAND",
              "PREMIUM QUALITY",
            ][i]}
        </h3>
        <p className="text-lg xl:text-base text-gray-600 dark:text-gray-300 transition-colors break-words overflow-hidden text-ellipsis line-clamp-3">
          {item?.description?.[language] ||
            [
              "Free Returns in the next 30 days",
              "From an old workshop in Luzern, Switzerland",
              "904L Stainless steel | Sapphire crystal",
            ][i]}
        </p>
      </div>
    );
  });

  return (
    <section className="bg-gradient-to-r from-gray-50 via-gray-100 to-gray-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 py-16 mt-8 rounded-lg overflow-hidden relative shadow-lg dark:shadow-gray-900/30 transition-all duration-300">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-16 text-slate-800 dark:text-white transition-colors">
          {title[language] ||
            title.en ||
            t("features.title") ||
            "Why Choose Us"}
        </h2>
        <div className="grid sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 xl:gap-8">
          {[0, 1, 2].map((i) => {
            const item = items[i];
            return (
              <div
                key={i}
                className="flex flex-col items-center justify-center text-center bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/20 transform transition-all duration-500 hover:scale-105 hover:shadow-xl dark:hover:shadow-gray-900/40 sm:p-4 md:p-6 md:min-w-[220px] xl:min-w-[340px]"
              >
                <div
                  className="mb-4 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-full transition-colors"
                  style={{ width: 100, height: 100 }}
                >
                  {getIcon(item?.icon)}
                </div>
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100 transition-colors break-words overflow-hidden text-ellipsis line-clamp-2 sm:text-lg md:text-xl xl:text-xl">
                  {item?.title?.[language] ||
                    t(`features.default.items.${i}.title`)}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 transition-colors break-words overflow-hidden text-ellipsis line-clamp-3 sm:text-sm md:text-base xl:text-lg">
                  {item?.description?.[language] ||
                    t(`features.default.items.${i}.description`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
