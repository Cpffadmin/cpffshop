"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from "@/providers/language/LanguageContext";
import axios from "axios";
import { format } from "date-fns";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

interface PrivacyPolicy {
  title: {
    en: string;
    "zh-TW": string;
  };
  subtitle: {
    en: string;
    "zh-TW": string;
  };
  sections: Array<{
    title: {
      en: string;
      "zh-TW": string;
    };
    content: {
      en: string;
      "zh-TW": string;
    };
  }>;
  contactInfo: {
    email: string;
    phone: string;
    address: {
      en: string;
      "zh-TW": string;
    };
  };
  lastUpdated: string;
}

export default function PrivacyPolicyPage() {
  const { t, language } = useTranslation();
  const [privacyPolicy, setPrivacyPolicy] = useState<PrivacyPolicy | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrivacyPolicy = async () => {
      try {
        const response = await axios.get("/api/store-settings");
        if (response.data.privacyPolicy) {
          setPrivacyPolicy(response.data.privacyPolicy);
        }
      } catch (err) {
        setError(t("common.error"));
        console.error("Error fetching privacy policy:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrivacyPolicy();
  }, [t]);

  if (isLoading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
        </div>
      </Container>
    );
  }

  if (!privacyPolicy) {
    return (
      <Container>
        <div className="text-center py-8">
          <p>{t("privacy.page.noSections")}</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Section className="py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">
            {privacyPolicy.title[language]}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            {privacyPolicy.subtitle[language]}
          </p>

          <div className="space-y-8">
            {privacyPolicy.sections.map((section, index) => (
              <div key={index} className="space-y-4">
                <h2 className="text-2xl font-semibold">
                  {section.title[language]}
                </h2>
                <div className="prose dark:prose-invert max-w-none">
                  {section.content[language].split("\n").map((paragraph, i) => (
                    <p key={i} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold mb-4">
              {t("privacy.page.contactUs")}
            </h2>
            <p className="mb-4">{t("privacy.page.questions")}</p>
            <div className="space-y-2">
              <p>
                <span className="font-medium">{t("privacy.page.email")}:</span>{" "}
                {privacyPolicy.contactInfo.email}
              </p>
              <p>
                <span className="font-medium">{t("privacy.page.phone")}:</span>{" "}
                {privacyPolicy.contactInfo.phone}
              </p>
              <p>
                <span className="font-medium">
                  {t("privacy.page.address")}:
                </span>{" "}
                {privacyPolicy.contactInfo.address[language]}
              </p>
            </div>
          </div>

          <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
            {t("privacy.page.lastUpdated")}:{" "}
            {format(new Date(privacyPolicy.lastUpdated), "PPP")}
          </div>
        </div>
      </Section>
    </Container>
  );
}
