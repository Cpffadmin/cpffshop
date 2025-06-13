"use client";

import { useTranslation } from "@/providers/language/LanguageContext";
import Image from "next/image";
import { Clock, User, Tag, FileText } from "lucide-react";
import NewsletterComponent from "@/components/HomepageComponents/NewsletterComponent";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { MultiLangDisplay } from "@/components/MultiLangInput/MultiLangInput";
import { useParams } from "next/navigation";
import { useBlogPost } from "@/lib/hooks/useBlog";
import { Button } from "@/components/ui/button";

export default function BlogPostPage() {
  const params = useParams();
  const { t, language: currentLanguage } = useTranslation();
  const slug = params?.slug;
  const { post, isLoading, isError, mutate } = useBlogPost(
    typeof slug === "string" ? slug : Array.isArray(slug) ? slug[0] : ""
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t("common.error")}</h1>
          <p className="text-muted-foreground mb-4">{t("blog.postNotFound")}</p>
          <Button
            onClick={() => mutate()}
            variant="outline"
            className="bg-white/50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            {t("common.retry")}
          </Button>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    {
      label: t("navigation.blog"),
      href: "/blog",
      icon: FileText,
    },
    {
      label: post.title[currentLanguage],
      href: `/blog/${
        typeof slug === "string" ? slug : Array.isArray(slug) ? slug[0] : ""
      }`,
      icon: FileText,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <article className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            <MultiLangDisplay
              value={post.title}
              currentLang={currentLanguage}
            />
          </h1>
          <div className="flex items-center justify-center text-sm text-muted-foreground space-x-6">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              <time
                dateTime={
                  post.publishedAt?.toString() || post.createdAt?.toString()
                }
              >
                {new Date(
                  post.publishedAt || post.createdAt || ""
                ).toLocaleDateString()}
              </time>
            </div>
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              <span>{post.author.name}</span>
            </div>
            <div className="flex items-center">
              <Tag className="w-4 h-4 mr-2" />
              <span>
                <MultiLangDisplay
                  value={{ en: post.category, "zh-TW": post.category }}
                  currentLang={currentLanguage}
                />
              </span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {post.mainImage && (
          <div className="max-w-4xl mx-auto mb-12">
            <div className="relative aspect-video">
              <Image
                src={post.mainImage || "/blog1.jpg"}
                alt={post.title[currentLanguage]}
                fill
                className="object-cover rounded-lg"
                priority
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="max-w-4xl mx-auto prose dark:prose-invert">
          <div
            dangerouslySetInnerHTML={{
              __html: post.content?.[currentLanguage] || "",
            }}
          />
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="max-w-4xl mx-auto mt-12">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm"
                >
                  <MultiLangDisplay
                    value={{ en: tag, "zh-TW": tag }}
                    currentLang={currentLanguage}
                  />
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Newsletter */}
      <div className="mt-16">
        <NewsletterComponent />
      </div>
    </div>
  );
}
