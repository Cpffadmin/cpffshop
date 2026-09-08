"use client";

import { CldUploadButton } from "next-cloudinary";
import type { CloudinaryUploadWidgetResults } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MultiLangInput } from "@/components/MultiLangInput/MultiLangInput";
import { useTranslation } from "@/providers/language/LanguageContext";
import {
  DEFAULT_NAV_INTROS,
  NAV_INTRO_KEYS,
  mergeNavIntro,
  mergeNavIntros,
  toPlayableVideoUrl,
  type NavIntroKey,
} from "@/lib/productPageIntro";
import type { SetSettings, StoreSettings } from "../settingsTypes";

const NAV_LABEL_KEYS: Record<NavIntroKey, string> = {
  home: "navigation.home",
  products: "navigation.products",
  quickOrder: "navigation.quickOrder",
  blog: "navigation.blog",
  about: "navigation.about",
  contact: "navigation.contact",
};

interface ProductIntroTabProps {
  settings: StoreSettings;
  setSettings: SetSettings;
  saveSettings: () => void;
  isLoading: boolean;
}

export default function ProductIntroTab({
  settings,
  setSettings,
  saveSettings,
  isLoading,
}: ProductIntroTabProps) {
  const { t } = useTranslation();
  const navIntros = mergeNavIntros(settings.navIntros, settings.productPageIntro);

  const updateIntro = (
    key: NavIntroKey,
    patch: Partial<(typeof navIntros)[NavIntroKey]>
  ) => {
    setSettings((prev) => {
      const nextNav = mergeNavIntros(prev.navIntros, prev.productPageIntro);
      nextNav[key] = mergeNavIntro(key, { ...nextNav[key], ...patch });
      return {
        ...prev,
        navIntros: nextNav,
        productPageIntro: nextNav.products,
      };
    });
  };

  const handleVideoUpload = (
    key: NavIntroKey,
    result: CloudinaryUploadWidgetResults
  ) => {
    if (
      result?.event === "success" &&
      typeof result.info === "object" &&
      result.info !== null &&
      "secure_url" in result.info &&
      typeof result.info.secure_url === "string"
    ) {
      updateIntro(key, { videoUrl: result.info.secure_url });
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-lg ring-1 ring-gray-200 dark:ring-gray-700">
      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
            {t("admin-settings.sections.productIntro.title")}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("admin-settings.sections.productIntro.description")}
          </p>
        </div>

        {NAV_INTRO_KEYS.map((key) => {
          const intro = navIntros[key];
          return (
            <div
              key={key}
              className="space-y-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t(NAV_LABEL_KEYS[key])}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t("admin-settings.sections.productIntro.enabledHelp")}
                  </p>
                </div>
                <Switch
                  id={`nav-intro-enabled-${key}`}
                  checked={intro.enabled}
                  onCheckedChange={(checked) =>
                    updateIntro(key, { enabled: checked })
                  }
                />
              </div>

              <div>
                <Label>
                  {t("admin-settings.sections.productIntro.video")}
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {t("admin-settings.sections.productIntro.videoHelp")}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {intro.videoUrl ? (
                    <video
                      src={toPlayableVideoUrl(intro.videoUrl)}
                      className="w-28 h-48 object-contain rounded bg-black"
                      controls
                      muted
                      playsInline
                    />
                  ) : (
                    <div className="flex w-28 h-48 items-center justify-center rounded bg-gray-100 text-center text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400 px-2">
                      {t("admin-settings.sections.productIntro.noVideo")}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <CldUploadButton
                      className="h-10 px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91]"
                      options={{
                        maxFiles: 1,
                        resourceType: "video",
                        clientAllowedFormats: ["mp4", "mov", "webm"],
                      }}
                      uploadPreset={
                        process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME
                      }
                      onSuccess={(result) => handleVideoUpload(key, result)}
                    >
                      {intro.videoUrl
                        ? t("admin-settings.sections.productIntro.changeVideo")
                        : t("admin-settings.sections.productIntro.uploadVideo")}
                    </CldUploadButton>
                    {intro.videoUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => updateIntro(key, { videoUrl: "" })}
                      >
                        {t("admin-settings.sections.productIntro.clearVideo")}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <MultiLangInput
                  type="textarea"
                  label={t("admin-settings.sections.productIntro.message")}
                  value={intro.message}
                  onChange={(value) => updateIntro(key, { message: value })}
                  placeholder={DEFAULT_NAV_INTROS[key].message}
                />
              </div>
            </div>
          );
        })}

        <div className="mt-6">
          <Button
            onClick={saveSettings}
            className="w-full md:w-auto bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] text-white"
            disabled={isLoading}
          >
            {isLoading
              ? t("admin-settings.actions.saving")
              : t("admin-settings.actions.save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
