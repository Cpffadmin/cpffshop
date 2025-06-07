"use client";

import React from "react";
import { useTranslation } from "@/providers/language/LanguageContext";
import { Shield, Clock, Wrench, CheckCircle } from "lucide-react";

const WarrantyPage = () => {
  const { t, language } = useTranslation();

  const warrantyItems = [
    {
      icon: Shield,
      title: {
        en: "2-Year International Warranty",
        "zh-TW": "2年國際保修",
      },
      description: {
        en: "All our watches come with a comprehensive 2-year international warranty covering manufacturing defects and mechanical issues.",
        "zh-TW":
          "我們的所有手錶都提供全面的2年國際保修，涵蓋製造缺陷和機械問題。",
      },
    },
    {
      icon: Clock,
      title: {
        en: "30-Day Return Policy",
        "zh-TW": "30天退貨政策",
      },
      description: {
        en: "Not satisfied with your purchase? Return it within 30 days for a full refund, no questions asked.",
        "zh-TW": "對購買不滿意？30天內無條件全額退款。",
      },
    },
    {
      icon: Wrench,
      title: {
        en: "Professional Service",
        "zh-TW": "專業服務",
      },
      description: {
        en: "Our certified watchmakers provide expert maintenance and repair services worldwide.",
        "zh-TW": "我們的認證製錶師提供全球專業維護和維修服務。",
      },
    },
    {
      icon: CheckCircle,
      title: {
        en: "Authenticity Guarantee",
        "zh-TW": "真品保證",
      },
      description: {
        en: "Every watch comes with an authenticity certificate and is sourced directly from authorized dealers.",
        "zh-TW": "每隻手錶都附有真品證書，並直接從授權經銷商處採購。",
      },
    },
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-12">
        {language === "zh-TW" ? "保修政策" : "Warranty Policy"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {warrantyItems.map((item, index) => (
          <div
            key={index}
            className="group flex flex-col items-start p-8 bg-card bg-opacity-80 backdrop-blur-lg rounded-lg transition-all duration-300 hover:bg-opacity-100 hover:shadow-2xl"
          >
            <div className="mb-4 text-yellow-500 group-hover:text-yellow-400 transition-all duration-300">
              <item.icon className="w-8 h-8" />
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

      <div className="mt-12 bg-muted/30 rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-6">
          {language === "zh-TW" ? "保修條款" : "Warranty Terms"}
        </h2>
        <ul className="space-y-4">
          <li className="flex items-start">
            <CheckCircle className="w-6 h-6 text-green-500 mr-2 flex-shrink-0 mt-1" />
            <p>
              {language === "zh-TW"
                ? "保修期從購買日期開始計算"
                : "Warranty period begins from the date of purchase"}
            </p>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-6 h-6 text-green-500 mr-2 flex-shrink-0 mt-1" />
            <p>
              {language === "zh-TW"
                ? "保修涵蓋所有製造缺陷和機械故障"
                : "Warranty covers all manufacturing defects and mechanical failures"}
            </p>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-6 h-6 text-green-500 mr-2 flex-shrink-0 mt-1" />
            <p>
              {language === "zh-TW"
                ? "正常磨損不在保修範圍內"
                : "Normal wear and tear is not covered under warranty"}
            </p>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-6 h-6 text-green-500 mr-2 flex-shrink-0 mt-1" />
            <p>
              {language === "zh-TW"
                ? "保修服務可在全球授權服務中心進行"
                : "Warranty service is available at authorized service centers worldwide"}
            </p>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default WarrantyPage;
