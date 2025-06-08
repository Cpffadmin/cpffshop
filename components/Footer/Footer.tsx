"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FaFacebookF, FaTwitter, FaInstagram } from "react-icons/fa";
import { HiOutlineMail } from "react-icons/hi";
import { useTranslation } from "@/providers/language/LanguageContext";
import { useStore } from "@/providers/store/StoreContext";
import { MultiLangDisplay } from "@/components/MultiLangInput/MultiLangInput";
import { useNewsletter } from "@/providers/newsletter/NewsletterContext";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";

const Footer = () => {
  const { t, language } = useTranslation();
  const { settings, isLoading } = useStore();
  const { subscribe, isLoading: isSubscribing, error } = useNewsletter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"success" | "error" | null>(null);

  const socialLinks = [
    {
      Icon: FaFacebookF,
      href: settings?.socialMedia?.facebook || "#",
      color: "blue",
    },
    {
      Icon: FaTwitter,
      href: settings?.socialMedia?.twitter || "#",
      color: "blue",
    },
    {
      Icon: FaInstagram,
      href: settings?.socialMedia?.instagram || "#",
      color: "blue",
    },
  ];

  // Prepare newsletter settings with fallbacks
  const newsletterTitle = settings?.newsletterSettings?.title || {
    en: t("footer.stayUpdated"),
    "zh-TW": t("footer.stayUpdated", { lng: "zh-TW" }),
  };

  const newsletterSubtitle = settings?.newsletterSettings?.subtitle || {
    en: t("footer.newsletterText"),
    "zh-TW": t("footer.newsletterText", { lng: "zh-TW" }),
  };

  const newsletterDisclaimer = settings?.newsletterSettings?.disclaimer || {
    en: t("footer.disclaimer"),
    "zh-TW": t("footer.disclaimer", { lng: "zh-TW" }),
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await subscribe(email, "footer");
      setStatus("success");
      setEmail("");
      // Clear status after 3 seconds
      setTimeout(() => {
        setStatus(null);
      }, 3000);
    } catch {
      setStatus("error");
      // Clear error after 3 seconds
      setTimeout(() => {
        setStatus(null);
      }, 3000);
    }
  };

  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand and description */}
          <div className="space-y-4">
            {isLoading ? (
              <>
                <LoadingSkeleton width="w-48" height="h-8" className="mb-2" />
                <LoadingSkeleton width="w-64" height="h-4" />
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">
                  <MultiLangDisplay
                    value={settings?.storeName}
                    currentLang={language}
                  />
                </h2>
                <p className="text-gray-300">
                  <MultiLangDisplay
                    value={settings?.slogan}
                    currentLang={language}
                  />
                </p>
              </>
            )}
          </div>

          {/* Quick Links */}
          <div>
            {isLoading ? (
              <>
                <LoadingSkeleton width="w-32" height="h-6" className="mb-4" />
                <div className="space-y-2">
                  {[...Array(4)].map((_, index) => (
                    <LoadingSkeleton key={index} width="w-24" height="h-4" />
                  ))}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">
                  {t("footer.quickLinks")}
                </h3>
                <ul className="space-y-2">
                  {[
                    { key: "home", label: t("navigation.home") },
                    { key: "blog", label: t("navigation.blog") },
                    { key: "about", label: t("navigation.about") },
                    { key: "contact", label: t("navigation.contact") },
                  ].map((item) => (
                    <li key={item.key}>
                      <Link
                        href={item.key === "home" ? "/" : `/${item.key}`}
                        className="text-gray-300 hover:text-blue-300 transition duration-300"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Customer Service */}
          <div>
            {isLoading ? (
              <>
                <LoadingSkeleton width="w-40" height="h-6" className="mb-4" />
                <div className="space-y-2">
                  {[...Array(4)].map((_, index) => (
                    <LoadingSkeleton key={index} width="w-32" height="h-4" />
                  ))}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">
                  {t("footer.customerService")}
                </h3>
                <ul className="space-y-2">
                  {[
                    {
                      key: "faq",
                      label: t("footer.faq"),
                      href: "/contact#faq-section",
                    },
                    {
                      key: "shipping-returns",
                      label: t("footer.shippingReturns"),
                      href: "/contact#shipping-returns-section",
                    },
                    { key: "warranty", label: t("footer.warranty") },
                    { key: "privacy-policy", label: t("footer.privacyPolicy") },
                  ].map((item) => (
                    <li key={item.key}>
                      <Link
                        href={item.href || `/${item.key}`}
                        className="text-gray-300 hover:text-blue-300 transition duration-300"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          {/* Stay Updated */}
          <div>
            {isLoading ? (
              <>
                <LoadingSkeleton width="w-40" height="h-6" className="mb-4" />
                <LoadingSkeleton
                  width="w-full"
                  height="h-16"
                  className="mb-4"
                />
                <div className="flex">
                  <LoadingSkeleton
                    width="w-full"
                    height="h-10"
                    className="mr-2"
                  />
                  <LoadingSkeleton width="w-12" height="h-10" />
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-4 border-b border-gray-700 pb-2">
                  <MultiLangDisplay
                    value={newsletterTitle}
                    currentLang={language}
                  />
                </h3>
                <p className="text-gray-300 mb-4">
                  <MultiLangDisplay
                    value={newsletterSubtitle}
                    currentLang={language}
                  />
                </p>
                <form onSubmit={handleSubmit} className="flex w-full max-w-md">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("footer.emailPlaceholder")}
                    className="flex-1 min-w-0 px-4 py-2 bg-gray-700 text-white rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isSubscribing}
                    className="flex-shrink-0 bg-blue-500 hover:bg-blue-600 text-gray-900 font-bold py-2 px-4 rounded-r-md transition duration-300 disabled:opacity-50"
                  >
                    <HiOutlineMail className="w-6 h-6" />
                  </button>
                </form>
                {status && (
                  <p
                    className={`mt-2 text-sm ${
                      status === "success" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {status === "success"
                      ? t("newsletter.successMessage")
                      : error || t("newsletter.errorMessage")}
                  </p>
                )}
                <p className="text-gray-400 text-xs mt-2">
                  <MultiLangDisplay
                    value={newsletterDisclaimer}
                    currentLang={language}
                  />
                </p>
              </>
            )}
          </div>
        </div>

        {/* Social Media and Copyright */}
        <div className="mt-12 pt-8 border-t border-gray-700 flex flex-col sm:flex-row justify-between items-center">
          {isLoading ? (
            <>
              <div className="flex space-x-6 mb-4 sm:mb-0">
                {[...Array(3)].map((_, index) => (
                  <LoadingSkeleton
                    key={index}
                    width="w-6"
                    height="h-6"
                    rounded={true}
                  />
                ))}
              </div>
              <LoadingSkeleton width="w-64" height="h-4" />
            </>
          ) : (
            <>
              <div className="flex space-x-6 mb-4 sm:mb-0">
                {socialLinks.map(({ Icon, href, color }, index) => (
                  <a
                    key={index}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-gray-400 hover:text-${color}-400 transition duration-300 transform hover:scale-110`}
                  >
                    <Icon className="w-6 h-6" />
                  </a>
                ))}
              </div>
              <p className="text-gray-400 text-sm">
                <MultiLangDisplay
                  value={settings?.copyright}
                  currentLang={language}
                  variables={{
                    year: new Date().getFullYear().toString(),
                    storeName: settings?.storeName?.[language] || "EcommWatch",
                  }}
                />
              </p>
            </>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
