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
import toast from "react-hot-toast";

// Define type for Cloudinary upload result
interface CloudinaryUploadWidgetInfo {
  secure_url: string;
}

interface CloudinaryUploadResult {
  event: "success";
  info: CloudinaryUploadWidgetInfo;
}

interface HeroSectionState {
  _id: string;
  title: string;
  description: string;
  creditText: string;
  media: {
    videoUrl: string;
    posterUrl: string;
    mediaType: "video" | "image";
  };
  buttons: {
    primary: {
      text: string;
      link: string;
    };
    secondary: {
      text: string;
      link: string;
    };
  };
  isActive: boolean;
  order: number;
}

export default function HeroSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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
      title: "New Hero Section",
      description: "Add your description here",
      creditText: "",
      media: {
        videoUrl: "",
        posterUrl: "/images/placeholder-hero.jpg",
        mediaType: "image" as const,
      },
      buttons: {
        primary: {
          text: "Shop Now",
          link: "/products",
        },
        secondary: {
          text: "Learn More",
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
        toast.success("Changes saved successfully");
        setHasUnsavedChanges(false);
      } catch {
        toast.error("Failed to save changes");
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
            label: "Admin",
            href: "/admin",
            icon: LayoutDashboard,
          },
          {
            label: "Settings",
            href: "/admin/settings",
            icon: Settings,
          },
          {
            label: "Hero Sections",
            href: "/admin/settings/hero",
            icon: Settings,
          },
        ]}
      />

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Hero Sections Management</h1>
        <Button onClick={handleAddNewSection}>Add New Section</Button>
      </div>

      <div className="space-y-6">
        {localSections.map((section, index) => (
          <Card key={section._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Section {index + 1}</CardTitle>
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
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={section.title}
                      onChange={(e) =>
                        handleLocalUpdate(section._id, {
                          title: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={section.description}
                      onChange={(e) =>
                        handleLocalUpdate(section._id, {
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label>Credit Text</Label>
                    <Input
                      value={section.creditText}
                      onChange={(e) =>
                        handleLocalUpdate(section._id, {
                          creditText: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Primary Button Text</Label>
                      <Input
                        value={section.buttons.primary.text}
                        onChange={(e) =>
                          handleLocalUpdate(section._id, {
                            buttons: {
                              ...section.buttons,
                              primary: {
                                ...section.buttons.primary,
                                text: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Primary Button Link</Label>
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Secondary Button Text</Label>
                      <Input
                        value={section.buttons.secondary.text}
                        onChange={(e) =>
                          handleLocalUpdate(section._id, {
                            buttons: {
                              ...section.buttons,
                              secondary: {
                                ...section.buttons.secondary,
                                text: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Secondary Button Link</Label>
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
                  </div>

                  <div className="space-y-6 border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Media Settings</h3>
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
                          Display Video
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
                          Display Poster
                        </button>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 mb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold mb-1">
                            Active Status
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Enable this section to display on homepage
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
                    </div>

                    <div className="space-y-6">
                      <div className="mb-4">
                        <Label>Video Upload</Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          Upload your hero video (MP4 format recommended)
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
                              const uploadResult =
                                result as CloudinaryUploadResult;
                              if (uploadResult?.info?.secure_url) {
                                updateVideo(
                                  section._id,
                                  uploadResult.info.secure_url
                                );
                                toast.success("Video uploaded successfully");
                              }
                            }}
                            uploadPreset={
                              process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME
                            }
                          >
                            <Button>
                              {section.media.videoUrl
                                ? "Change Video"
                                : "Upload Video"}
                            </Button>
                          </CldUploadButton>
                        </div>
                      </div>

                      <div>
                        <Label>Image Upload</Label>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          Upload your hero image
                        </p>
                        <div className="flex items-center space-x-4">
                          {section.media.posterUrl && (
                            <div className="relative w-40 h-24">
                              <Image
                                src={section.media.posterUrl}
                                alt="Hero Image"
                                fill
                                className="object-cover rounded"
                              />
                            </div>
                          )}
                          <CldUploadButton
                            onSuccess={(result: unknown) => {
                              const uploadResult =
                                result as CloudinaryUploadResult;
                              if (uploadResult?.info?.secure_url) {
                                updatePoster(
                                  section._id,
                                  uploadResult.info.secure_url
                                );
                                toast.success("Image uploaded successfully");
                              }
                            }}
                            uploadPreset={
                              process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME
                            }
                          >
                            <Button>
                              {section.media.posterUrl
                                ? "Change Image"
                                : "Upload Image"}
                            </Button>
                          </CldUploadButton>
                        </div>
                      </div>
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
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
