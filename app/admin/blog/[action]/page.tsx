"use client";

import { Metadata } from "next";
import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { LayoutDashboard, FileText, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useBlog } from "@/providers/blog/BlogContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiLangInput } from "@/components/MultiLangInput";
import { useTranslation } from "@/providers/language/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CldUploadButton,
  CloudinaryUploadWidgetResults,
} from "next-cloudinary";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface MultiLangValue {
  en: string;
  "zh-TW": string;
}

interface BlogPostFormData {
  title: MultiLangValue;
  content: MultiLangValue;
  excerpt: MultiLangValue;
  category: string;
  status: "draft" | "published";
  featured: boolean;
  mainImage?: string;
  tags: string[];
  seo: {
    metaTitle: MultiLangValue;
    metaDescription: MultiLangValue;
    keywords: string[];
  };
}

interface CloudinaryUploadInfo {
  secure_url: string;
  [key: string]: unknown;
}

interface CloudinaryResult extends Omit<CloudinaryUploadWidgetResults, "info"> {
  info: CloudinaryUploadInfo;
}

interface BlogPostPageProps {
  params: { action: string };
  searchParams: { id?: string | undefined };
}

const BlogPostPage: React.FC<BlogPostPageProps> = ({
  params,
  searchParams,
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { refreshFeaturedPost } = useBlog();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const unwrappedParams = use(params);
  const unwrappedSearchParams = use(searchParams);
  const [formData, setFormData] = useState<BlogPostFormData>({
    title: {
      en: "",
      "zh-TW": "",
    },
    content: {
      en: "",
      "zh-TW": "",
    },
    excerpt: {
      en: "",
      "zh-TW": "",
    },
    category: "",
    status: "draft",
    featured: false,
    tags: [],
    seo: {
      metaTitle: {
        en: "",
        "zh-TW": "",
      },
      metaDescription: {
        en: "",
        "zh-TW": "",
      },
      keywords: [],
    },
  });

  const isEditing = unwrappedParams.action === "edit";
  const pageTitle = isEditing
    ? t("blog.posts.edit.title")
    : t("blog.posts.create");

  const breadcrumbItems = [
    {
      label: t("navigation.adminPanel"),
      href: "/admin",
      icon: LayoutDashboard,
    },
    {
      label: t("blog.posts.pageTitle"),
      href: "/admin/blog/posts",
      icon: FileText,
    },
    {
      label: isEditing ? t("blog.posts.edit.title") : t("blog.posts.create"),
      href: `/admin/blog/${unwrappedParams.action}`,
      icon: FileText,
    },
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !session?.user?.admin) {
      router.push("/");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchPost = async () => {
      if (isEditing && unwrappedSearchParams.id) {
        try {
          setIsLoading(true);
          const res = await fetch(
            `/api/blog/posts/${unwrappedSearchParams.id}`
          );
          if (!res.ok) throw new Error("Failed to fetch post");
          const post = await res.json();
          setFormData(post);
        } catch (error) {
          console.error("Failed to fetch blog post:", error);
          toast.error("Failed to fetch blog post. Please try again.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (session?.user?.admin) {
      fetchPost();
    }
  }, [isEditing, unwrappedSearchParams.id, session]);

  const handleInputChange = (
    field: keyof BlogPostFormData,
    value: string | boolean | string[] | MultiLangValue,
    lang?: "en" | "zh-TW"
  ) => {
    if (field === "category" || field === "status") {
      setFormData((prev) => ({
        ...prev,
        [field]: value as string,
      }));
    } else if (field === "featured") {
      setFormData((prev) => ({
        ...prev,
        [field]: value as boolean,
      }));
    } else if (field === "tags") {
      setFormData((prev) => ({
        ...prev,
        [field]: value as string[],
      }));
    } else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      // Handle multilingual input directly
      setFormData((prev) => ({
        ...prev,
        [field]: value as MultiLangValue,
      }));
    } else if (lang) {
      // Handle single language update for multilingual fields
      setFormData((prev) => ({
        ...prev,
        [field]: {
          ...(prev[field] as MultiLangValue),
          [lang]: value as string,
        },
      }));
    }
  };

  const handleSeoChange = (
    field: "metaTitle" | "metaDescription" | "keywords",
    value: string | string[] | MultiLangValue,
    lang?: "en" | "zh-TW"
  ) => {
    if (field === "keywords") {
      setFormData((prev) => ({
        ...prev,
        seo: {
          ...prev.seo,
          keywords:
            typeof value === "string"
              ? value.split(",").map((k: string) => k.trim())
              : Array.isArray(value)
              ? value
              : [],
        },
      }));
    } else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      // Handle multilingual input directly
      setFormData((prev) => ({
        ...prev,
        seo: {
          ...prev.seo,
          [field]: value as MultiLangValue,
        },
      }));
    } else if (lang) {
      // Handle single language update
      setFormData((prev) => ({
        ...prev,
        seo: {
          ...prev.seo,
          [field]: {
            ...(prev.seo[field] as MultiLangValue),
            [lang]: value as string,
          },
        },
      }));
    }
  };

  const handleImageUpload = (result: CloudinaryResult) => {
    if (result.info?.secure_url) {
      setFormData((prev) => ({
        ...prev,
        mainImage: result.info.secure_url,
      }));
      toast.success("Image uploaded successfully");
    } else {
      toast.error("Failed to upload image. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.admin) return;

    try {
      setIsLoading(true);
      const url = isEditing
        ? `/api/blog/posts/${unwrappedSearchParams.id}`
        : "/api/blog/posts";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save blog post");
      }

      const savedPost = await response.json();
      toast.success(
        isEditing
          ? t("blog.posts.edit.success")
          : t("blog.posts.create.success")
      );
      refreshFeaturedPost();
      router.push("/admin/blog/posts");
    } catch (error) {
      console.error("Failed to save blog post:", error);
      toast.error(
        isEditing ? t("blog.posts.edit.error") : t("blog.posts.create.error")
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (
    status === "loading" ||
    (status === "authenticated" && !session?.user?.admin)
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#535C91] dark:border-[#6B74A9]"></div>
          <span className="animate-pulse">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
        <Breadcrumb items={breadcrumbItems} />
      <h1 className="text-3xl font-bold mb-6">{pageTitle}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("blog.posts.edit.titleLabel")}</CardTitle>
                <CardDescription>
                  {t("blog.posts.edit.titlePlaceholder")}
                </CardDescription>
              </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("blog.posts.edit.titleLabel")}</Label>
                <MultiLangInput
                  value={formData.title}
                  onChange={(value) => handleInputChange("title", value)}
                  placeholder={{
                    en: t("blog.posts.edit.titlePlaceholder"),
                    "zh-TW": t("blog.posts.edit.titlePlaceholder"),
                  }}
                />
            </div>

            <div className="space-y-2">
              <Label>{t("blog.posts.edit.contentLabel")}</Label>
                <MultiLangInput
                  value={formData.content}
                  onChange={(value) => handleInputChange("content", value)}
                multiline
                  placeholder={{
                    en: t("blog.posts.edit.contentPlaceholder"),
                    "zh-TW": t("blog.posts.edit.contentPlaceholder"),
                  }}
                />
          </div>

            <div className="space-y-2">
              <Label>{t("blog.posts.edit.excerptLabel")}</Label>
                  <MultiLangInput
                value={formData.excerpt}
                onChange={(value) => handleInputChange("excerpt", value)}
                multiline
                    placeholder={{
                  en: t("blog.posts.edit.excerptPlaceholder"),
                  "zh-TW": t("blog.posts.edit.excerptPlaceholder"),
                    }}
                  />
            </div>

            <div className="space-y-2">
              <Label>{t("blog.posts.edit.categoryLabel")}</Label>
              <Select
                    value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("blog.posts.edit.categoryPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="news">
                    {t("blog.categories.news")}
                  </SelectItem>
                  <SelectItem value="tutorials">
                    {t("blog.categories.tutorials")}
                  </SelectItem>
                  <SelectItem value="updates">
                    {t("blog.categories.updates")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("blog.posts.edit.statusLabel")}</Label>
                    <Select
                      value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
                    >
                      <SelectTrigger>
                  <SelectValue placeholder={t("blog.posts.edit.statusLabel")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">
                          {t("blog.posts.statusTypes.draft")}
                        </SelectItem>
                        <SelectItem value="published">
                          {t("blog.posts.statusTypes.published")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                id="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) =>
                        handleInputChange("featured", checked)
                      }
                    />
              <Label htmlFor="featured">
                {t("blog.posts.edit.featuredLabel")}
              </Label>
            </div>

            <div className="space-y-2">
              <Label>{t("blog.posts.edit.mainImageLabel")}</Label>
              <div className="flex items-center space-x-4">
                {formData.mainImage && (
                  <div className="relative w-32 h-32">
                    <Image
                      src={formData.mainImage}
                      alt="Main"
                      fill
                      className="object-cover rounded-lg"
                    />
                  </div>
                )}
                <CldUploadButton
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME}
                  onSuccess={handleImageUpload}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>{t("blog.posts.edit.uploadMainImage")}</span>
                </CldUploadButton>
              </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
            <CardTitle>{t("blog.posts.edit.seoTitle")}</CardTitle>
            <CardDescription>{t("blog.posts.edit.seoTitle")}</CardDescription>
                </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t("blog.posts.edit.seoTitleLabel")}</Label>
              <MultiLangInput
                value={formData.seo.metaTitle}
                onChange={(value) => handleSeoChange("metaTitle", value)}
                placeholder={{
                  en: t("blog.posts.edit.seoTitlePlaceholder"),
                  "zh-TW": t("blog.posts.edit.seoTitlePlaceholder"),
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("blog.posts.edit.seoDescriptionLabel")}</Label>
              <MultiLangInput
                value={formData.seo.metaDescription}
                onChange={(value) => handleSeoChange("metaDescription", value)}
                multiline
                placeholder={{
                  en: t("blog.posts.edit.seoDescriptionPlaceholder"),
                  "zh-TW": t("blog.posts.edit.seoDescriptionPlaceholder"),
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("blog.posts.edit.seoKeywordsLabel")}</Label>
              <Input
                value={formData.seo.keywords.join(", ")}
                onChange={(e) => handleSeoChange("keywords", e.target.value)}
                placeholder={t("blog.posts.edit.seoKeywordsPlaceholder")}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/blog/posts")}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? t("blog.posts.edit.saving")
              : isEditing
              ? t("common.save")
              : t("common.create")}
          </Button>
          </div>
        </form>
    </div>
  );
};

export default BlogPostPage;
