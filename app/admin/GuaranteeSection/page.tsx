"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@/providers/language/LanguageContext";
import toast from "react-hot-toast";
import { Shield, RefreshCcw, Truck, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import * as LucideIcons from "lucide-react";

interface GuaranteeItem {
  icon: "Shield" | "RefreshCcw" | "Truck" | "Award";
  title: {
    en: string;
    "zh-TW": string;
  };
  description: {
    en: string;
    "zh-TW": string;
  };
}

const renderIcon = (icon: string) => {
  // Detect inline SVG string
  if (/^<svg[\s\S]*<\/svg>$/.test(icon.trim())) {
    // Ensure fill uses currentColor for Tailwind to work
    const svgWithCurrentColor = icon.replace(
      /fill="[^"]*"/g,
      'fill="currentColor"'
    );
    return (
      <span
        className="w-8 h-8 text-yellow-500"
        style={{ display: "inline-block" }}
        dangerouslySetInnerHTML={{ __html: svgWithCurrentColor }}
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
        className="inline-block align-middle object-contain"
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

export default function GuaranteeSectionPage() {
  const { t, language } = useTranslation();
  const [items, setItems] = useState<GuaranteeItem[]>([
    {
      icon: "Shield",
      title: { en: "", "zh-TW": "" },
      description: { en: "", "zh-TW": "" },
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState({ en: "", "zh-TW": "" });

  const fetchGuaranteeSection = useCallback(async () => {
    try {
      const response = await fetch("/api/guarantee-section");
      if (!response.ok) throw new Error("Failed to fetch guarantee section");
      const data = await response.json();
      if (data.items) {
        setItems(data.items);
      }
      if (data.title) {
        setTitle(data.title);
      }
    } catch (error) {
      console.error("Error fetching guarantee section:", error);
      toast.error(t("common.error"));
    }
  }, [t]);

  useEffect(() => {
    fetchGuaranteeSection();
  }, [fetchGuaranteeSection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/guarantee-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, items }),
      });

      if (!response.ok) throw new Error("Failed to update guarantee section");

      toast.success(t("common.success"));
    } catch (error) {
      console.error("Error updating guarantee section:", error);
      toast.error(t("common.error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof GuaranteeItem,
    value: any,
    lang?: "en" | "zh-TW"
  ) => {
    const newItems = [...items];
    if (field === "icon") {
      newItems[index].icon = value;
    } else if ((field === "title" || field === "description") && lang) {
      newItems[index][field][lang] = value;
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        icon: "Shield",
        title: { en: "", "zh-TW": "" },
        description: { en: "", "zh-TW": "" },
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">
        {t("guarantee.managementTitle")}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">
              {t("guarantee.title")} (EN)
            </label>
            <Input
              value={title.en}
              onChange={(e) => setTitle({ ...title, en: e.target.value })}
              placeholder={t("guarantee.titlePlaceholder")}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">
              {t("guarantee.title")} (繁體中文)
            </label>
            <Input
              value={title["zh-TW"]}
              onChange={(e) =>
                setTitle({ ...title, ["zh-TW"]: e.target.value })
              }
              placeholder={t("guarantee.titlePlaceholder")}
            />
          </div>
        </div>
        {items.map((item, index) => (
          <div key={index} className="p-6 border rounded-lg mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {t("guarantee.item")} {index + 1}
              </h3>
              <Button
                type="button"
                variant="destructive"
                onClick={() => removeItem(index)}
              >
                {t("common.delete")}
              </Button>
            </div>

            <div className="mb-4">
              <label className="block font-medium mb-1">
                {t("guarantee.icon")}
              </label>
              <div className="flex gap-2 items-center">
                <Input
                  className="w-full"
                  value={item.icon}
                  onChange={(e) =>
                    handleItemChange(index, "icon", e.target.value)
                  }
                  placeholder={
                    t("guarantee.icon") + " (emoji, url, or icon name)"
                  }
                />
                {/* Preview */}
                <span className="ml-2">
                  {item.icon && renderIcon(item.icon)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">
                  {t("guarantee.title")} (EN)
                </label>
                <Input
                  value={item.title.en}
                  onChange={(e) =>
                    handleItemChange(index, "title", e.target.value, "en")
                  }
                  placeholder={t("guarantee.titlePlaceholder")}
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  {t("guarantee.title")} (繁體中文)
                </label>
                <Input
                  value={item.title["zh-TW"]}
                  onChange={(e) =>
                    handleItemChange(index, "title", e.target.value, "zh-TW")
                  }
                  placeholder={t("guarantee.titlePlaceholder")}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block font-medium mb-1">
                  {t("guarantee.description")} (EN)
                </label>
                <Textarea
                  value={item.description.en}
                  onChange={(e) =>
                    handleItemChange(index, "description", e.target.value, "en")
                  }
                  placeholder={t("guarantee.descriptionPlaceholder")}
                />
              </div>
              <div>
                <label className="block font-medium mb-1">
                  {t("guarantee.description")} (繁體中文)
                </label>
                <Textarea
                  value={item.description["zh-TW"]}
                  onChange={(e) =>
                    handleItemChange(
                      index,
                      "description",
                      e.target.value,
                      "zh-TW"
                    )
                  }
                  placeholder={t("guarantee.descriptionPlaceholder")}
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex gap-4">
          <Button type="button" onClick={addItem}>
            {t("guarantee.addItem")}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? t("common.saving") : t("common.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
