"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2, MoveUp, MoveDown, Save } from "lucide-react";
import { CldUploadButton } from "next-cloudinary";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useHero } from "@/providers/hero/HeroContext";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { LayoutDashboard, Settings } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useTranslation } from "@/providers/language/LanguageContext";
import toast from "react-hot-toast";
import { MultiLangInput } from "@/components/MultiLangInput/MultiLangInput";

// Define type for Cloudinary upload result
interface CloudinaryUploadWidgetInfo {
  secure_url: string;
}

interface CloudinaryUploadResult {
  event: "success";
  info: CloudinaryUploadWidgetInfo;
}

interface MultiLangValue {
  en: string;
  "zh-TW": string;
}

interface HeroSectionState {
  _id: string;
  title: MultiLangValue;
  description: MultiLangValue;
  creditText: MultiLangValue;
  media: {
    videoUrl: string;
    posterUrl: string;
    mediaType: "video" | "image";
  };
  buttons: {
    primary: {
      text: MultiLangValue;
      link: string;
    };
    secondary: {
      text: MultiLangValue;
      link: string;
    };
  };
  isActive: boolean;
  order: number;
}

export default function HeroSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useTranslation();
  const {
    heroSections,
    isLoading,
    updateHeroSection,
    updateVideo,
    updatePoster,
    addHeroSection,
    removeHeroSection,
    reorderSections,
    setActiveSection,
  } = useHero();

  // Local state for unsaved changes
  const [localSections, setLocalSections] = useState<HeroSectionState[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize local state with hero sections
  useEffect(() => {
    if (heroSections) {
      setLocalSections(heroSections);
    }
  }, [heroSections]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || isLoading) {
    return <div>Loading...</div>;
  }

  if (!session?.user) {
    return null;
  }

  const handleAddNewSection = () => {
    const newSection = {
      title: { en: "New Section", "zh-TW": "新章節" },
      description: { en: "Section Description", "zh-TW": "章節描述" },
      creditText: { en: "", "zh-TW": "" },
      media: {
        videoUrl: "",
        posterUrl: "/images/placeholder-hero.jpg",
        mediaType: "image" as const,
      },
      buttons: {
        primary: {
          text: { en: "Shop Now", "zh-TW": "立即購買" },
          link: "/products",
        },
        secondary: {
          text: { en: "Learn More", "zh-TW": "了解更多" },
          link: "/about",
        },
      },
      isActive: false,
      order: localSections.length,
    };
    addHeroSection(newSection);
  };

  const handleLocalUpdate = (
    sectionId: string,
    updates: Partial<HeroSectionState>
  ) => {
    setLocalSections((prev) =>
      prev.map((section) =>
        section._id === sectionId ? { ...section, ...updates } : section
      )
    );
    setHasUnsavedChanges(true);
  };

  const handleSaveChanges = async (sectionId: string) => {
    const sectionToUpdate = localSections.find((s) => s._id === sectionId);
    if (sectionToUpdate) {
      try {
        await updateHeroSection(sectionId, sectionToUpdate);
        toast.success(t("admin-hero.section.messages.saveSuccess"));
        setHasUnsavedChanges(false);
      } catch {
        toast.error(t("admin-hero.section.messages.saveError"));
      }
    }
  };

  const handleMoveSection = async (
    sectionId: string,
    direction: "up" | "down"
  ) => {
    const currentIndex = localSections.findIndex((s) => s._id === sectionId);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === localSections.length - 1)
    ) {
      return;
    }

    const newOrder = localSections.map((s) => s._id);
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;
    [newOrder[currentIndex], newOrder[targetIndex]] = [
      newOrder[targetIndex],
      newOrder[currentIndex],
    ];

    await reorderSections(newOrder);
  };

  return (
    <div className="container mx-auto py-8">
      <Breadcrumb
        items={[
          {
            label: t("admin-hero.breadcrumb.admin"),
            href: "/admin",
            icon: LayoutDashboard,
          },
          {
            label: t("admin-hero.breadcrumb.settings"),
            href: "/admin/settings",
            icon: Settings,
          },
          {
            label: t("admin-hero.breadcrumb.heroSections"),
            href: "/admin/settings/hero",
            icon: Settings,
          },
        ]}
      />

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">{t("admin-hero.title")}</h1>
        <Button onClick={handleAddNewSection}>
          {t("admin-hero.addNewSection")}
        </Button>
      </div>

      <div className="space-y-6">
        {localSections.map((section, index) => (
          <Card key={section._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {t("admin-hero.section.title", { number: index + 1 })}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleMoveSection(section._id, "up")}
                    disabled={index === 0}
                  >
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleMoveSection(section._id, "down")}
                    disabled={index === localSections.length - 1}
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => removeHeroSection(section._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="space-y-4">
                  {/* Title Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>
                        {t("admin-hero.section.fields.title")} (English)
                      </Label>
                      <Input
                        value={section.title.en}
                        onChange={(e) =>
                          handleLocalUpdate(section._id, {
                            title: { ...section.title, en: e.target.value },
                          })
                        }
                        placeholder="Enter title in English"
                      />
                    </div>
                    <div>
                      <Label>
                        {t("admin-hero.section.fields.title")} (中文)
                      </Label>
                      <Input
                        value={section.title["zh-TW"]}
                        onChange={(e) =>
                          handleLocalUpdate(section._id, {
                            title: {
                              ...section.title,
                              "zh-TW": e.target.value,
                            },
                          })
                        }
                        placeholder="輸入中文標題"
                      />
                    </div>
                  </div>

                  {/* Description Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>
                        {t("admin-hero.section.fields.description")} (English)
                      </Label>
                      <Textarea
                        value={section.description.en}
                        onChange={(e) =>
                          handleLocalUpdate(section._id, {
                            description: {
                              ...section.description,
                              en: e.target.value,
                            },
                          })
                        }
                        placeholder="Enter description in English"
                      />
                    </div>
                    <div>
                      <Label>
                        {t("admin-hero.section.fields.description")} (中文)
                      </Label>
                      <Textarea
                        value={section.description["zh-TW"]}
                        onChange={(e) =>
                          handleLocalUpdate(section._id, {
                            description: {
                              ...section.description,
                              "zh-TW": e.target.value,
                            },
                          })
                        }
                        placeholder="輸入中文描述"
                      />
                    </div>
                  </div>

                  {/* Credit Text Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>
                        {t("admin-hero.section.fields.creditText")} (English)
                      </Label>
                      <Input
                        value={section.creditText.en}
                        onChange={(e) =>
                          handleLocalUpdate(section._id, {
                            creditText: {
                              ...section.creditText,
                              en: e.target.value,
                            },
                          })
                        }
                        placeholder="Enter credit text in English"
                      />
                    </div>
                    <div>
                      <Label>
                        {t("admin-hero.section.fields.creditText")} (中文)
                      </Label>
                      <Input
                        value={section.creditText["zh-TW"]}
                        onChange={(e) =>
                          handleLocalUpdate(section._id, {
                            creditText: {
                              ...section.creditText,
                              "zh-TW": e.target.value,
                            },
                          })
                        }
                        placeholder="輸入中文版權文字"
                      />
                    </div>
                  </div>

                  {/* Primary Button Text Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>
                        {t("admin-hero.section.fields.buttons.primary.text")}{" "}
                        (English)
                      </Label>
                      <Input
                        value={section.buttons.primary.text.en}
                        onChange={(e) =>
                          handleLocalUpdate(section._id, {
                            buttons: {
                              ...section.buttons,
                              primary: {
                                ...section.buttons.primary,
                                text: {
                                  ...section.buttons.primary.text,
                                  en: e.target.value,
                                },
                              },
                            },
                          })
                        }
                        placeholder="Enter primary button text in English"
                      />
                    </div>
                    <div>
                      <Label>
                        {t("admin-hero.section.fields.buttons.primary.text")}{" "}
                        (中文)
                      </Label>
                      <Input
                        value={section.buttons.primary.text["zh-TW"]}
                        onChange={(e) =>
                          handleLocalUpdate(section._id, {
                            buttons: {
                              ...section.buttons,
                              primary: {
                                ...section.buttons.primary,
                                text: {
                                  ...section.buttons.primary.text,
                                  "zh-TW": e.target.value,
                                },
                              },
                            },
                          })
                        }
                        placeholder="輸入中文主按鈕文字"
                      />
                    </div>
                  </div>

                  {/* Primary Button Link */}
                  <div>
                    <Label>
                      {t("admin-hero.section.fields.buttons.primary.link")}
                    </Label>
                    <Input
                      value={section.buttons.primary.link}
                      onChange={(e) =>
                        handleLocalUpdate(section._id, {
                          buttons: {
                            ...section.buttons,
                            primary: {
                              ...section.buttons.primary,
                              link: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>

                  {/* Secondary Button Text Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>
                        {t("admin-hero.section.fields.buttons.secondary.text")}{" "}
                        (English)
                      </Label>
                      <Input
                        value={section.buttons.secondary.text.en}
                        onChange={(e) =>
                          handleLocalUpdate(section._id, {
                            buttons: {
                              ...section.buttons,
                              secondary: {
                                ...section.buttons.secondary,
                                text: {
                                  ...section.buttons.secondary.text,
                                  en: e.target.value,
                                },
                              },
                            },
                          })
                        }
                        placeholder="Enter secondary button text in English"
                      />
                    </div>
                    <div>
                      <Label>
                        {t("admin-hero.section.fields.buttons.secondary.text")}{" "}
                        (中文)
                      </Label>
                      <Input
                        value={section.buttons.secondary.text["zh-TW"]}
                        onChange={(e) =>
                          handleLocalUpdate(section._id, {
                            buttons: {
                              ...section.buttons,
                              secondary: {
                                ...section.buttons.secondary,
                                text: {
                                  ...section.buttons.secondary.text,
                                  "zh-TW": e.target.value,
                                },
                              },
                            },
                          })
                        }
                        placeholder="輸入中文次按鈕文字"
                      />
                    </div>
                  </div>

                  {/* Secondary Button Link */}
                  <div>
                    <Label>
                      {t("admin-hero.section.fields.buttons.secondary.link")}
                    </Label>
                    <Input
                      value={section.buttons.secondary.link}
                      onChange={(e) =>
                        handleLocalUpdate(section._id, {
                          buttons: {
                            ...section.buttons,
                            secondary: {
                              ...section.buttons.secondary,
                              link: e.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>

                  {/* Media Settings */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      {t("admin-hero.section.fields.media.title")}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const updatedMedia = {
                            videoUrl: section.media.videoUrl,
                            posterUrl: section.media.posterUrl,
                            mediaType: "video" as const,
                          };
                          handleLocalUpdate(section._id, {
                            media: updatedMedia,
                          });
                        }}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          section.media.mediaType === "video"
                            ? "bg-primary text-primary-foreground"
                            : "bg-gray-100 text-muted-foreground hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                        }`}
                      >
                        {t("admin-hero.section.fields.media.displayVideo")}
                      </button>
                      <button
                        onClick={() => {
                          const updatedMedia = {
                            videoUrl: section.media.videoUrl,
                            posterUrl: section.media.posterUrl,
                            mediaType: "image" as const,
                          };
                          handleLocalUpdate(section._id, {
                            media: updatedMedia,
                          });
                        }}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          section.media.mediaType === "image"
                            ? "bg-primary text-primary-foreground"
                            : "bg-gray-100 text-muted-foreground hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                        }`}
                      >
                        {t("admin-hero.section.fields.media.displayPoster")}
                      </button>
                    </div>
                  </div>

                  {/* Active Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">
                        {t("admin-hero.section.fields.activeStatus.title")}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t(
                          "admin-hero.section.fields.activeStatus.description"
                        )}
                      </p>
                    </div>
                    <Switch
                      id={`active-${section._id}`}
                      checked={section.isActive}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setActiveSection(section._id);
                        }
                      }}
                      className="scale-110 data-[state=checked]:bg-primary"
                    />
                  </div>

                  {/* Video Upload */}
                  <div className="mb-4">
                    <Label>
                      {t("admin-hero.section.fields.media.video.title")}
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {t("admin-hero.section.fields.media.video.description")}
                    </p>
                    <div className="flex items-center space-x-4">
                      {section.media.videoUrl &&
                        section.media.mediaType === "video" && (
                          <video
                            src={section.media.videoUrl}
                            className="w-40 h-24 object-cover rounded"
                            controls
                          />
                        )}
                      <CldUploadButton
                        onSuccess={(result: unknown) => {
                          const uploadResult = result as CloudinaryUploadResult;
                          if (uploadResult?.info?.secure_url) {
                            updateVideo(
                              section._id,
                              uploadResult.info.secure_url
                            );
                            toast.success(
                              t(
                                "admin-hero.section.messages.videoUploadSuccess"
                              )
                            );
                          }
                        }}
                        uploadPreset={
                          process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME
                        }
                      >
                        <Button asChild>
                          <span>
                            {section.media.videoUrl
                              ? t(
                                  "admin-hero.section.fields.media.video.change"
                                )
                              : t(
                                  "admin-hero.section.fields.media.video.upload"
                                )}
                          </span>
                        </Button>
                      </CldUploadButton>
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <Label>
                      {t("admin-hero.section.fields.media.image.title")}
                    </Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {t("admin-hero.section.fields.media.image.description")}
                    </p>
                    <div className="flex items-center space-x-4">
                      {section.media.posterUrl && (
                        <div className="relative w-40 h-24">
                          <Image
                            src={section.media.posterUrl}
                            alt="Hero Image"
                            fill
                            sizes="160px"
                            className="object-cover rounded"
                          />
                        </div>
                      )}
                      <CldUploadButton
                        onSuccess={(result: unknown) => {
                          const uploadResult = result as CloudinaryUploadResult;
                          if (uploadResult?.info?.secure_url) {
                            updatePoster(
                              section._id,
                              uploadResult.info.secure_url
                            );
                            toast.success(
                              t(
                                "admin-hero.section.messages.imageUploadSuccess"
                              )
                            );
                          }
                        }}
                        uploadPreset={
                          process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME
                        }
                      >
                        <Button asChild>
                          <span>
                            {section.media.posterUrl
                              ? t(
                                  "admin-hero.section.fields.media.image.change"
                                )
                              : t(
                                  "admin-hero.section.fields.media.image.upload"
                                )}
                          </span>
                        </Button>
                      </CldUploadButton>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                onClick={() => handleSaveChanges(section._id)}
                disabled={!hasUnsavedChanges}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {t("admin-hero.section.actions.save")}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
