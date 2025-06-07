"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/providers/language/LanguageContext";
import toast from "react-hot-toast";
import Image from "next/image";
import * as LucideIcons from "lucide-react";
import useSWR from "swr";

interface GuaranteeItem {
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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const GuaranteeSection = () => {
  const { t, language } = useTranslation();

  // Use SWR for fetching and caching
  const { data, error, isLoading } = useSWR("/api/guarantee-section", fetcher);

  // Fallbacks for data
  const items = data?.items || [];
  const title = data?.title || { en: "", "zh-TW": "" };

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
          alt="icon"
          width={32}
          height={32}
          className="object-contain"
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
    return <span className="text-3xl text-yellow-500">{icon}</span>;
  };

  // Determine grid and container classes based on item count
  const itemCount = items.length;
  let gridCols = "";
  let containerMaxWidth = "";
  if (itemCount === 1) {
    gridCols = "grid-cols-1 justify-center";
    containerMaxWidth = "max-w-md mx-auto";
  } else if (itemCount === 2) {
    gridCols = "grid-cols-1 sm:grid-cols-2";
    containerMaxWidth = "max-w-2xl mx-auto";
  } else if (itemCount === 3) {
    gridCols = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";
    containerMaxWidth = "max-w-4xl mx-auto";
  } else {
    gridCols = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
    containerMaxWidth = "max-w-6xl mx-auto";
  }

  if (isLoading) {
    return (
      <section className="bg-muted/30 mt-8 rounded-lg pb-12 pt-10 overflow-hidden relative shadow-lg">
        <div className="container mx-auto px-4 relative z-10">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-1/3 mx-auto mb-16"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-8 rounded-lg">
                  <div className="h-8 w-8 bg-gray-200 rounded-full mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    // ...existing error handling or fallback...
  }

  return (
    <section className="bg-muted/30 mt-8 rounded-lg pb-12 pt-10 overflow-hidden relative shadow-lg">
      <div
        className={`container mx-auto px-4 relative z-10 ${containerMaxWidth}`}
      >
        <h2 className="text-4xl font-bold text-center mb-16 text-foreground">
          {title[language] || title.en || t("guarantee.title")}
        </h2>
        <div className={`grid gap-8 ${gridCols}`}>
          {items.map((item: GuaranteeItem, index: number) => (
            <div
              key={index}
              className="group flex flex-col items-start p-8 bg-card bg-opacity-80 backdrop-blur-lg rounded-lg transition-all duration-300 hover:bg-opacity-100 hover:shadow-2xl"
            >
              <div className="mb-4 text-yellow-500 group-hover:text-yellow-400 transition-all duration-300">
                {renderIcon(item.icon)}
              </div>
              <h3 className="text-2xl font-semibold mb-2 text-foreground">
                {item.title[language]}
              </h3>
              <p className="text-muted-foreground">
                {item.description[language]}
              </p>
              <div className="mt-4 h-1 w-16 bg-primary/20 group-hover:w-full group-hover:bg-primary transition-all duration-300"></div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/20"></div>
    </section>
  );
};

export default GuaranteeSection;
