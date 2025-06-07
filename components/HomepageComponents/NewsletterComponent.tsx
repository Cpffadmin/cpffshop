"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, Check } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";
import { useNewsletter } from "@/providers/newsletter/NewsletterContext";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useStore } from "@/providers/store/StoreContext";
import { MultiLangDisplay } from "@/components/MultiLangInput/MultiLangInput";

interface NewsletterComponentProps {
  variant?: "simple" | "detailed";
  source?: string;
  className?: string;
}

const NewsletterComponent = ({
  variant = "detailed",
  source = "homepage",
  className = "",
}: NewsletterComponentProps) => {
  const { t, language } = useTranslation();
  const [email, setEmail] = useState("");
  const { subscribe, isLoading: isSubscribing, error } = useNewsletter();
  const { settings, isLoading: isSettingsLoading } = useStore();
  const [status, setStatus] = useState<"success" | "error" | null>(null);
  const [localSettings, setLocalSettings] = useState(
    settings?.newsletterSettings
  );
  const [isMounted, setIsMounted] = useState(true);

  // Move useEffect before any conditional returns
  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Update local settings when store settings change
  useEffect(() => {
    if (settings?.newsletterSettings) {
      console.log(
        "Settings updated in NewsletterComponent:",
        settings.newsletterSettings
      );
      setLocalSettings(settings.newsletterSettings);
    }
  }, [settings]);

  // Default newsletter settings
  const defaultNewsletterSettings = {
    title: {
      en: t("newsletter.title"),
      "zh-TW": t("newsletter.title", { lng: "zh-TW" }),
    },
    subtitle: {
      en: t("newsletter.description"),
      "zh-TW": t("newsletter.description", { lng: "zh-TW" }),
    },
    bannerImage: "/newsletter.jpg",
    discountPercentage: 15,
    buttonText: {
      en: t("newsletter.buttonText"),
      "zh-TW": t("newsletter.buttonText", { lng: "zh-TW" }),
    },
    disclaimer: {
      en: t("newsletter.disclaimer"),
      "zh-TW": t("newsletter.disclaimer", { lng: "zh-TW" }),
    },
  };

  // Use local settings if available, otherwise use defaults
  const newsletterSettings = localSettings || defaultNewsletterSettings;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isMounted) return;

    try {
      await subscribe(email, source);
      setStatus("success");
      setEmail("");
      // Clear status after 3 seconds
      setTimeout(() => {
        if (isMounted) {
          setStatus(null);
        }
      }, 3000);
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      if (isMounted) {
        setStatus("error");
      }
      // Clear error after 3 seconds
      setTimeout(() => {
        if (isMounted) {
          setStatus(null);
        }
      }, 3000);
    }
  };

  // If still loading and no settings available, show loading state
  if (isSettingsLoading && !localSettings) {
    return (
      <div className={`flex justify-center items-center py-8 ${className}`}>
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  if (variant === "simple") {
    return (
      <div className={`py-4 ${className}`}>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("footer.emailPlaceholder")}
            className="flex-grow px-4 py-2 bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <button
            type="submit"
            disabled={isSubscribing}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isSubscribing ? t("common.loading") : t("newsletter.buttonText")}
          </button>
        </form>
        {status && (
          <p
            className={`mt-2 text-sm ${
              status === "success" ? "text-green-500" : "text-red-500"
            }`}
          >
            {status === "success"
              ? t("common.success")
              : error || t("common.error")}
          </p>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center mb-6"
        >
          <Image
            src={settings.logo}
            alt={
              typeof settings.storeName === "string"
                ? settings.storeName
                : settings.storeName[language]
            }
            width={40}
            height={40}
            className="rounded-full object-contain"
          />
        </motion.div>

        {variant === "detailed" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <Image
              src={newsletterSettings.bannerImage}
              alt={t("newsletter.bannerAlt")}
              width={800}
              height={400}
              className="w-full h-auto object-cover rounded-lg"
            />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-extrabold text-foreground mb-2">
            <MultiLangDisplay
              value={newsletterSettings.title}
              currentLang={language}
            />
          </h2>
          <p className="text-muted-foreground text-lg">
            <MultiLangDisplay
              value={newsletterSettings.subtitle}
              currentLang={language}
            />
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("newsletter.emailPlaceholder")}
              className="w-full px-6 py-3 text-base text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#535C91] dark:focus:ring-[#6B74A9] focus:border-transparent"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <button
              type="submit"
              className="w-full px-6 py-3 text-sm font-medium text-white bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] rounded-md transition-colors disabled:opacity-50"
            >
              {isSubscribing ? (
                t("common.loading")
              ) : (
                <MultiLangDisplay
                  value={newsletterSettings.buttonText}
                  currentLang={language}
                />
              )}
            </button>
          </motion.div>
        </form>

        {status && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`mt-4 p-4 rounded-md ${
              status === "success"
                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100"
                : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100"
            }`}
          >
            {status === "success" ? (
              <>
                {t("newsletter.successMessage")}{" "}
                {(newsletterSettings.discountPercentage || 0) > 0 && (
                  <span className="font-bold">
                    {newsletterSettings.discountPercentage}% OFF
                  </span>
                )}
              </>
            ) : (
              t("newsletter.errorMessage")
            )}
          </motion.div>
        )}

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-xs text-muted-foreground mt-4 text-center"
        >
          <MultiLangDisplay
            value={newsletterSettings.disclaimer}
            currentLang={language}
          />
        </motion.p>
      </div>
    </motion.div>
  );
};

export default NewsletterComponent;
