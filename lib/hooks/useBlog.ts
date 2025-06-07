import useSWR from "swr";
import axios from "axios";
import { useTranslation } from "@/providers/language/LanguageContext";

const fetcher = (url: string) => axios.get(url).then((res) => res.data);

export interface MultiLangField {
  en: string;
  "zh-TW": string;
}

export interface BlogPostLean {
  _id: string;
  title: MultiLangField;
  excerpt: MultiLangField;
  content?: MultiLangField;
  slug: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  status?: "draft" | "published";
  featured?: boolean;
  featuredImage?: string;
  tags?: string[];
  category: string;
  publishedAt?: Date;
  updatedAt?: Date;
  createdAt?: Date;
  seo?: {
    metaTitle: MultiLangField;
    metaDescription: MultiLangField;
    keywords: string[];
  };
}

export interface BlogResponse {
  posts: BlogPostLean[];
  total: number;
  featuredPost?: BlogPostLean;
}

// Hook for blog listing page
export const useBlogList = (page: number = 1, limit: number = 6) => {
  const { language } = useTranslation();

  // Fetch regular posts
  const {
    data: postsData,
    error: postsError,
    mutate: mutatePosts,
  } = useSWR<BlogResponse>(
    `/api/blog/posts?page=${page}&limit=${limit}&excludeFeatured=true`,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  // Fetch featured post
  const {
    data: featuredData,
    error: featuredError,
    mutate: mutateFeatured,
  } = useSWR<{ featuredPost: BlogPostLean }>("/api/blog/featured", fetcher, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 5000,
  });

  const isLoading =
    !postsError && !postsData && !featuredError && !featuredData;
  const isError = postsError || featuredError;

  const refreshAll = async () => {
    await Promise.all([mutatePosts(), mutateFeatured()]);
  };

  return {
    posts: postsData?.posts || [],
    totalPosts: postsData?.total || 0,
    featuredPost: featuredData?.featuredPost,
    isLoading,
    isError,
    refreshAll,
    mutatePosts,
    mutateFeatured,
  };
};

// Hook for individual blog post
export const useBlogPost = (slug: string) => {
  const { data, error, mutate } = useSWR<BlogPostLean>(
    slug ? `/api/blog/posts/${slug}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    post: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
};
