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
  featuredImage?: string;
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

export default function BlogPostPage({
  params,
  searchParams,
}: {
  params: { action: string };
  searchParams: { id?: string };
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { refreshFeaturedPost } = useBlog();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
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

  const isEditing = params.action === "edit";
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
      href: `/admin/blog/${params.action}`,
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
      if (isEditing && searchParams.id) {
        try {
          setIsLoading(true);
          const res = await fetch(`/api/blog/posts/${searchParams.id}`);
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
  }, [isEditing, searchParams.id, session]);

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

  const handleImageUpload = (result: CloudinaryUploadWidgetResults) => {
    if (
      result?.event === "success" &&
      typeof result.info === "object" &&
      "secure_url" in result.info
    ) {
      const imageUrl = result.info.secure_url as string;
      setFormData((prev) => ({
        ...prev,
        featuredImage: imageUrl,
      }));
      toast.success("Featured image uploaded successfully");
    } else {
      toast.error("Failed to upload featured image");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Log form data before validation
      console.log(
        "Form data before submission:",
        JSON.stringify(formData, null, 2)
      );

      // Validate required fields
      if (!formData.title.en || !formData.title["zh-TW"]) {
        toast.error("Title is required in both English and Chinese");
        setIsLoading(false);
        return;
      }

      if (!formData.content.en || !formData.content["zh-TW"]) {
        toast.error("Content is required in both English and Chinese");
        setIsLoading(false);
        return;
      }

      if (!formData.category) {
        toast.error("Category is required");
        setIsLoading(false);
        return;
      }

      const endpoint = isEditing
        ? `/api/blog/posts/${searchParams.id}`
        : "/api/blog/posts";

      // Log the request details
      console.log("Making request to:", endpoint);
      console.log("Request method:", isEditing ? "PUT" : "POST");
      console.log("Request body:", JSON.stringify(formData, null, 2));

      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          // Ensure excerpt has both languages even if empty
          excerpt: {
            en: formData.excerpt.en || "",
            "zh-TW": formData.excerpt["zh-TW"] || "",
          },
          // Ensure SEO fields have both languages even if empty
          seo: {
            ...formData.seo,
            metaTitle: {
              en: formData.seo.metaTitle.en || "",
              "zh-TW": formData.seo.metaTitle["zh-TW"] || "",
            },
            metaDescription: {
              en: formData.seo.metaDescription.en || "",
              "zh-TW": formData.seo.metaDescription["zh-TW"] || "",
            },
          },
        }),
      });

      const data = await response.json();
      console.log("Response status:", response.status);
      console.log("Response data:", data);

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to save post");
      }

      // If the post is featured, refresh the featured post state
      if (formData.featured) {
        await refreshFeaturedPost();
      }

      toast.success(
        isEditing
          ? "Blog post updated successfully"
          : "Blog post created successfully"
      );

      // Redirect back to posts list
      router.push("/admin/blog/posts");
    } catch (error: any) {
      console.error("Failed to save blog post:", error);
      // Log the full error details
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        response: error.response,
      });
      toast.error(
        error.message || "Failed to save blog post. Please try again."
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="app-global-container">
        <Breadcrumb items={breadcrumbItems} />
        <div className="bg-card rounded-lg p-6 shadow-md">
          <h1 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-[#535C91] to-[#424874] dark:from-[#6B74A9] dark:to-[#535C91] bg-clip-text text-transparent">
            {pageTitle}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {isEditing
              ? t("blog.posts.edit.description")
              : t("blog.posts.create.description")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 mt-6">
          {/* Mobile Grid View (<=640px) */}
          <div className="block sm:hidden space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t("blog.posts.edit.titleLabel")}</CardTitle>
                <CardDescription>
                  {t("blog.posts.edit.titlePlaceholder")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MultiLangInput
                  value={formData.title}
                  onChange={(value) => handleInputChange("title", value)}
                  placeholder={{
                    en: t("blog.posts.edit.titlePlaceholder"),
                    "zh-TW": t("blog.posts.edit.titlePlaceholder"),
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("blog.posts.edit.contentLabel")}</CardTitle>
                <CardDescription>
                  {t("blog.posts.edit.contentPlaceholder")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MultiLangInput
                  type="textarea"
                  value={formData.content}
                  onChange={(value) => handleInputChange("content", value)}
                  placeholder={{
                    en: t("blog.posts.edit.contentPlaceholder"),
                    "zh-TW": t("blog.posts.edit.contentPlaceholder"),
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("blog.posts.edit.statusLabel")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Select
                    value={formData.status}
                    onValueChange={(value: "draft" | "published") =>
                      handleInputChange("status", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                    checked={formData.featured}
                    onCheckedChange={(checked) =>
                      handleInputChange("featured", checked)
                    }
                  />
                  <Label>{t("blog.posts.edit.featuredLabel")}</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("blog.posts.edit.categoryLabel")}</CardTitle>
                <CardDescription>
                  {t("blog.posts.edit.categoryPlaceholder")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={formData.category}
                  onChange={(e) =>
                    handleInputChange("category", e.target.value)
                  }
                  placeholder={t("blog.posts.edit.categoryPlaceholder")}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("blog.posts.edit.tagsLabel")}</CardTitle>
                <CardDescription>
                  {t("blog.posts.edit.tagsPlaceholder")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={formData.tags.join(", ")}
                  onChange={(e) =>
                    handleInputChange(
                      "tags",
                      e.target.value.split(",").map((tag) => tag.trim())
                    )
                  }
                  placeholder={t("blog.posts.edit.tagsPlaceholder")}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4">
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? t("blog.posts.edit.saving") : t("common.save")}
              </Button>
            </div>
          </div>

          {/* Desktop Table View (>640px) */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("blog.posts.edit.titleLabel")}</CardTitle>
                  <CardDescription>
                    {t("blog.posts.edit.titlePlaceholder")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MultiLangInput
                    value={formData.title}
                    onChange={(value) => handleInputChange("title", value)}
                    placeholder={{
                      en: t("blog.posts.edit.titlePlaceholder"),
                      "zh-TW": t("blog.posts.edit.titlePlaceholder"),
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("blog.posts.edit.categoryLabel")}</CardTitle>
                  <CardDescription>
                    {t("blog.posts.edit.categoryPlaceholder")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    value={formData.category}
                    onChange={(e) =>
                      handleInputChange("category", e.target.value)
                    }
                    placeholder={t("blog.posts.edit.categoryPlaceholder")}
                  />
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>{t("blog.posts.edit.contentLabel")}</CardTitle>
                <CardDescription>
                  {t("blog.posts.edit.contentPlaceholder")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MultiLangInput
                  type="textarea"
                  value={formData.content}
                  onChange={(value) => handleInputChange("content", value)}
                  placeholder={{
                    en: t("blog.posts.edit.contentPlaceholder"),
                    "zh-TW": t("blog.posts.edit.contentPlaceholder"),
                  }}
                />
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t("blog.posts.edit.statusLabel")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Select
                      value={formData.status}
                      onValueChange={(value: "draft" | "published") =>
                        handleInputChange("status", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                      checked={formData.featured}
                      onCheckedChange={(checked) =>
                        handleInputChange("featured", checked)
                      }
                    />
                    <Label>{t("blog.posts.edit.featuredLabel")}</Label>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t("blog.posts.edit.tagsLabel")}</CardTitle>
                  <CardDescription>
                    {t("blog.posts.edit.tagsPlaceholder")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Input
                    value={formData.tags.join(", ")}
                    onChange={(e) =>
                      handleInputChange(
                        "tags",
                        e.target.value.split(",").map((tag) => tag.trim())
                      )
                    }
                    placeholder={t("blog.posts.edit.tagsPlaceholder")}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t("blog.posts.edit.saving") : t("common.save")}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
