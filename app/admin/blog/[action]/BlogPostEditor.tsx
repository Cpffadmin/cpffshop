"use client";

import { useEffect, useState } from "react";
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
import { CldUploadButton } from "next-cloudinary";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";

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

export const BlogPostEditor = ({
  action,
  id,
}: {
  action: string;
  id?: string;
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { refreshFeaturedPost } = useBlog();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<BlogPostFormData>({
    title: { en: "", "zh-TW": "" },
    content: { en: "", "zh-TW": "" },
    excerpt: { en: "", "zh-TW": "" },
    category: "",
    status: "draft",
    featured: false,
    tags: [],
    seo: {
      metaTitle: { en: "", "zh-TW": "" },
      metaDescription: { en: "", "zh-TW": "" },
      keywords: [],
    },
  });

  const isEditing = action === "edit";
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
      href: `/admin/blog/${action}`,
      icon: FileText,
    },
  ];

  useEffect(() => {
    const fetchPost = async () => {
      if (isEditing && id) {
        try {
          setIsLoading(true);
          const res = await fetch(`/api/blog/posts/${id}`);
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

    fetchPost();
  }, [isEditing, id]);

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
      setFormData((prev) => ({
        ...prev,
        [field]: value as MultiLangValue,
      }));
    } else if (lang) {
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
      setFormData((prev) => ({
        ...prev,
        seo: {
          ...prev.seo,
          [field]: value as MultiLangValue,
        },
      }));
    } else if (lang) {
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

  const { handleUpload, isUploading, uploadOptions } = useCloudinaryUpload({
    onSuccess: (url) => {
      setFormData((prev) => ({
        ...prev,
        mainImage: url,
      }));
    },
    folder: "blog-posts",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.admin) return;

    try {
      setIsLoading(true);
      const url = isEditing ? `/api/blog/posts/${id}` : "/api/blog/posts";
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
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
                type="textarea"
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
                type="textarea"
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
                      sizes="128px"
                      className="object-cover rounded-lg"
                    />
                  </div>
                )}
                <CldUploadButton
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME}
                  onSuccess={handleUpload}
                  options={uploadOptions}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>
                    {isUploading
                      ? "Uploading..."
                      : t("blog.posts.edit.uploadMainImage")}
                  </span>
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
                type="textarea"
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

export default BlogPostEditor;
