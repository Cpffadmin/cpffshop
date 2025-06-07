"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BlogPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/blog/posts");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-gray-900"></div>
        <span>Redirecting to blog posts...</span>
      </div>
    </div>
  );
}
