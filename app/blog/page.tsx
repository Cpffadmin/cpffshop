"use client";

import { useState } from "react";
import { useBlog } from "@/providers/blog/BlogContext";
import { FileText, User, Clock, Tag } from "lucide-react";
import NewsletterComponent from "@/components/HomepageComponents/NewsletterComponent";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { format } from "date-fns";
import { useTranslation } from "@/providers/language/LanguageContext";
import { MultiLangDisplay } from "@/components/MultiLangInput/MultiLangInput";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import useSWR from "swr";

// Force dynamic rendering
export const dynamic = "force-dynamic";

const POSTS_PER_PAGE = 6;

interface MultiLangField {
  en: string;
  "zh-TW": string;
}

interface BlogPostLean {
  _id: string;
  title: MultiLangField;
  excerpt: MultiLangField;
  slug: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  featuredImage?: string;
  publishedAt?: Date;
  category: string;
}

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store", next: { revalidate: 0 } }).then((res) =>
    res.json()
  );

export default function BlogPage() {
  const { featuredPost, refreshFeaturedPost } = useBlog();
  const { t, language: currentLanguage } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);

  const { data, error, isLoading } = useSWR(
    `/api/blog/posts?page=${currentPage}&limit=${POSTS_PER_PAGE}&excludeFeatured=true`,
    fetcher
  );

  const posts = data?.posts || [];
  const totalPages = data ? Math.ceil(data.total / POSTS_PER_PAGE) : 1;

  const breadcrumbItems = [
    {
      label: t("navigation.blog"),
      href: "/blog",
      icon: FileText,
    },
  ];

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-500 dark:text-red-400 bg-white/50 dark:bg-gray-800/50 p-8 rounded-lg shadow-sm">
            {t("blog.error")}
            <Button
              onClick={() => refreshFeaturedPost()}
              variant="outline"
              className="mt-4 bg-white/50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            >
              {t("common.retry")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="mb-8">
            {/* Breadcrumb Skeleton */}
            <LoadingSkeleton height="h-6" width="w-40" className="mb-6" />
            {/* Featured Article Title Skeleton */}
            <LoadingSkeleton height="h-10" width="w-64" className="mb-2" />
            <LoadingSkeleton height="h-5" width="w-80" className="mb-8" />
            {/* Featured Article Card Skeleton */}
            <div className="mb-12 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="relative h-[300px] md:h-[400px]">
                  <LoadingSkeleton height="h-full" className="rounded-none" />
                </div>
                <div className="flex flex-col justify-start p-6">
                  <LoadingSkeleton
                    height="h-10"
                    width="w-3/4"
                    className="mb-4"
                  />
                  <LoadingSkeleton
                    height="h-6"
                    width="w-full"
                    className="mb-6"
                  />
                  <div className="flex items-center gap-4 mb-6">
                    <LoadingSkeleton height="h-4" width="w-20" />
                    <LoadingSkeleton height="h-4" width="w-20" />
                    <LoadingSkeleton height="h-4" width="w-20" />
                  </div>
                  <LoadingSkeleton height="h-10" width="w-32" />
                </div>
              </div>
            </div>
            {/* All Posts Title Skeleton */}
            <LoadingSkeleton height="h-8" width="w-48" className="mb-2" />
            <LoadingSkeleton height="h-5" width="w-64" className="mb-8" />
            {/* All Posts Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
                >
                  <div className="relative h-48">
                    <LoadingSkeleton height="h-full" className="rounded-none" />
                  </div>
                  <div className="p-4 space-y-3">
                    <LoadingSkeleton height="h-6" width="w-3/4" />
                    <LoadingSkeleton height="h-4" width="w-full" />
                    <LoadingSkeleton height="h-4" width="w-2/3" />
                    <div className="flex items-center gap-4">
                      <LoadingSkeleton height="h-4" width="w-20" />
                      <LoadingSkeleton height="h-4" width="w-20" />
                      <LoadingSkeleton height="h-4" width="w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <Breadcrumb items={breadcrumbItems} />
            {/* Featured Post Section */}
            {featuredPost && (
              <>
                {/* Featured Article Title */}
                <div className="mb-8">
                  <h2 className="text-4xl font-bold text-yellow-500 dark:text-yellow-400">
                    {t("blog.featuredArticle")}
                  </h2>
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    {t("blog.discoverStory")}
                  </p>
                </div>
                <div className="mb-12 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="relative h-[300px] md:h-[400px]">
                      {featuredPost.featuredImage ? (
                        <Image
                          src={featuredPost.featuredImage || "/blog1.jpg"}
                          alt={featuredPost.title[currentLanguage]}
                          fill
                          className="object-cover"
                          priority
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 dark:bg-gray-700" />
                      )}
                    </div>
                    <div className="flex flex-col justify-start p-6">
                      <h3 className="text-4xl font-bold mb-4 text-yellow-500 dark:text-yellow-400 leading-tight">
                        <MultiLangDisplay
                          value={featuredPost.title}
                          currentLang={currentLanguage}
                        />
                      </h3>
                      <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
                        <MultiLangDisplay
                          value={featuredPost.excerpt}
                          currentLang={currentLanguage}
                        />
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>
                            {typeof featuredPost.author === "object"
                              ? featuredPost.author.name
                              : featuredPost.author}
                          </span>
                        </div>
                        {featuredPost.publishedAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {format(
                                new Date(featuredPost.publishedAt),
                                "MMM d, yyyy"
                              )}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          <span>
                            <MultiLangDisplay
                              value={{
                                en: featuredPost.category,
                                "zh-TW": featuredPost.category,
                              }}
                              currentLang={currentLanguage}
                            />
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/blog/${featuredPost.slug}`}
                        className="inline-block px-6 py-3 bg-[#535C91] hover:bg-[#424874] dark:bg-[#6B74A9] dark:hover:bg-[#535C91] text-white rounded-md transition-colors duration-200 text-center mt-auto"
                      >
                        {t("blog.readMore")}
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            )}
            {/* All Posts Title */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {t("blog.allPosts")}
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-300">
                {t("blog.exploreArticles")}
              </p>
            </div>
            {/* All Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts && posts.length > 0 ? (
                posts.map((post: BlogPostLean) => (
                  <Link
                    key={post._id}
                    href={`/blog/${post.slug}`}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
                  >
                    <div className="relative h-48">
                      {post.featuredImage ? (
                        <Image
                          src={post.featuredImage || "/blog1.jpg"}
                          alt={post.title[currentLanguage]}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 dark:bg-gray-700" />
                      )}
                    </div>
                    <div className="p-4">
                      <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
                        <MultiLangDisplay
                          value={post.title}
                          currentLang={currentLanguage}
                        />
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                        <MultiLangDisplay
                          value={post.excerpt}
                          currentLang={currentLanguage}
                        />
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>
                            {typeof post.author === "object"
                              ? post.author.name
                              : post.author}
                          </span>
                        </div>
                        {post.publishedAt && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {format(
                                new Date(post.publishedAt),
                                "MMM d, yyyy"
                              )}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          <span>
                            <MultiLangDisplay
                              value={{
                                en: post.category,
                                "zh-TW": post.category,
                              }}
                              currentLang={currentLanguage}
                            />
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                  {t("blog.noPosts")}
                </div>
              )}
            </div>
            {/* Pagination */}
            {!isLoading && posts.length > 0 && (
              <div className="mt-8 flex justify-center gap-2">
                <Button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  {t("common.previous")}
                </Button>
                <Button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  {t("common.next")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Newsletter Section */}
      <NewsletterComponent variant="detailed" source="blog" className="mt-16" />
    </div>
  );
}
