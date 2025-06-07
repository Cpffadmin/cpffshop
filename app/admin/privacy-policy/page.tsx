"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/providers/language/LanguageContext";
import { LayoutDashboard, FileText } from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";

import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiLangInput } from "@/components/MultiLangInput/MultiLangInput";

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

export default function PrivacyPolicyAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const [settings, setSettings] = useState<PrivacyPolicy>({
    title: { en: "", "zh-TW": "" },
    subtitle: { en: "", "zh-TW": "" },
    sections: [],
    contactInfo: {
      email: "",
      phone: "",
      address: { en: "", "zh-TW": "" },
    },
    lastUpdated: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!session?.user?.admin) return;

      setIsLoading(true);
      try {
        const response = await axios.get("/api/store-settings");
        console.log("Fetched settings:", response.data);
        if (response.data?.privacyPolicy) {
          setSettings(response.data.privacyPolicy);
        }
      } catch (error) {
        console.error("Error fetching privacy policy settings:", error);
        toast.error(t("privacy.fetchError"), {
          duration: 3000,
          position: "top-right",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [session, t]);

  const handleInputChange = (
    value: { en: string; "zh-TW": string } | string | any[],
    field: string
  ) => {
    setSettings((prev) => {
      const newSettings = { ...prev };
      const fieldParts = field.split(".");
      let current: any = newSettings;

      for (let i = 0; i < fieldParts.length - 1; i++) {
        if (!current[fieldParts[i]]) {
          current[fieldParts[i]] = Array.isArray(value) ? [] : {};
        }
        current = current[fieldParts[i]];
      }

      current[fieldParts[fieldParts.length - 1]] = value;
      return newSettings;
    });
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      console.log("Saving settings:", settings);
      const response = await axios.post("/api/store-settings", {
        settings: {
          privacyPolicy: settings,
        },
      });

      console.log("Save response:", response.data);
      if (response.data?.privacyPolicy) {
        setSettings(response.data.privacyPolicy);
        toast.success(t("privacy.saved"), {
          duration: 3000,
          position: "top-right",
        });
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(t("privacy.saveError"), {
        duration: 3000,
        position: "top-right",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const breadcrumbItems = [
    {
      label: t("navigation.admin"),
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: t("navigation.privacyPolicy"),
      href: "/admin/privacy-policy",
      icon: FileText,
    },
  ];

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="app-global-container">
        <Breadcrumb items={breadcrumbItems} />
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-[#535C91] to-[#424874] dark:from-[#6B74A9] dark:to-[#535C91] bg-clip-text text-transparent">
            {t("navigation.privacyPolicy")}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t("privacy.description")}
          </p>
        </div>

        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-gray-700">
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("privacy.title")}
              </label>
              <MultiLangInput
                value={settings.title}
                onChange={(value) => handleInputChange(value, "title")}
                placeholder={{
                  en: t("privacy.titlePlaceholder"),
                  "zh-TW": t("privacy.titlePlaceholder"),
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t("privacy.subtitle")}
              </label>
              <MultiLangInput
                value={settings.subtitle}
                onChange={(value) => handleInputChange(value, "subtitle")}
                placeholder={{
                  en: t("privacy.subtitlePlaceholder"),
                  "zh-TW": t("privacy.subtitlePlaceholder"),
                }}
              />
            </div>

            <div className="space-y-4">
              {settings.sections.map((section, index) => (
                <div key={index} className="border p-4 rounded-lg">
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                      {t("privacy.sectionTitle")}
                    </label>
                    <MultiLangInput
                      value={section.title}
                      onChange={(value) =>
                        handleInputChange(value, `sections.${index}.title`)
                      }
                      placeholder={{
                        en: t("privacy.sectionTitlePlaceholder"),
                        "zh-TW": t("privacy.sectionTitlePlaceholder"),
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {t("privacy.sectionContent")}
                    </label>
                    <MultiLangInput
                      value={section.content}
                      onChange={(value) =>
                        handleInputChange(value, `sections.${index}.content`)
                      }
                      placeholder={{
                        en: t("privacy.sectionContentPlaceholder"),
                        "zh-TW": t("privacy.sectionContentPlaceholder"),
                      }}
                    />
                  </div>

                  <Button
                    onClick={() => {
                      const newSections = [...settings.sections];
                      newSections.splice(index, 1);
                      handleInputChange(newSections, "sections");
                    }}
                    variant="destructive"
                    className="mt-4"
                  >
                    {t("privacy.removeSection")}
                  </Button>
                </div>
              ))}

              <Button
                onClick={() => {
                  const newSections = [
                    ...settings.sections,
                    {
                      title: { en: "", "zh-TW": "" },
                      content: { en: "", "zh-TW": "" },
                    },
                  ];
                  handleInputChange(newSections, "sections");
                }}
                className="w-full"
              >
                {t("privacy.addSection")}
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("privacy.contactEmail")}
                </label>
                <Input
                  value={settings.contactInfo.email}
                  onChange={(e) =>
                    handleInputChange(e.target.value, "contactInfo.email")
                  }
                  placeholder={t("privacy.contactEmailPlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("privacy.contactPhone")}
                </label>
                <Input
                  value={settings.contactInfo.phone}
                  onChange={(e) =>
                    handleInputChange(e.target.value, "contactInfo.phone")
                  }
                  placeholder={t("privacy.contactPhonePlaceholder")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("privacy.contactAddress")}
                </label>
                <MultiLangInput
                  value={settings.contactInfo.address}
                  onChange={(value) =>
                    handleInputChange(value, "contactInfo.address")
                  }
                  placeholder={{
                    en: t("privacy.contactAddressPlaceholder"),
                    "zh-TW": t("privacy.contactAddressPlaceholder"),
                  }}
                />
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={saveSettings}
              className="w-full md:w-auto bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] text-white"
              disabled={isLoading}
            >
              {isLoading ? t("common.saving") : t("common.saveChanges")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
