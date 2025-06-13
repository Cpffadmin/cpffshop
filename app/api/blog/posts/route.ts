import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth.config";
import { connectToDatabase } from "@/utils/database";
import BlogPost from "@/utils/models/BlogPost";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const excludeFeatured = url.searchParams.get("excludeFeatured") === "true";
    const isAdmin = url.searchParams.get("admin") === "true";

    // Build query
    const query: any = {};

    // For non-admin requests, only show published posts
    if (!isAdmin) {
      query.status = "published";
    }

    // Exclude featured posts if requested
    if (excludeFeatured) {
      query.featured = false;
    }

    console.log("Blog posts query:", JSON.stringify(query, null, 2));

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("author", "name email")
        .lean(),
      BlogPost.countDocuments(query),
    ]);

    console.log(`Found ${posts.length} posts out of ${total} total`);

    // Transform the posts to ensure proper structure
    const transformedPosts = posts.map((post) => ({
      ...post,
      author:
        typeof post.author === "object"
          ? {
              _id: post.author._id,
              name: post.author.name || "Unknown",
              email: post.author.email,
            }
          : { _id: "", name: "Unknown", email: "" },
    }));

    return NextResponse.json({
      posts: transformedPosts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: unknown) {
    console.error("Error fetching blog posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}

interface BlogPostData {
  title: Record<string, string>;
  content: Record<string, string>;
  excerpt: Record<string, string>;
  category: string;
  status: string;
  featured: boolean;
  mainImage?: string;
  tags: string[];
  seo: {
    metaTitle: Record<string, string>;
    metaDescription: Record<string, string>;
    keywords: string[];
  };
}

interface ValidationError {
  error: string;
  details: string;
}

function validateBlogPost(data: BlogPostData): ValidationError | null {
  if (!data.title || !data.content || !data.category) {
    return {
      error: "Missing required fields",
      details: "Title, content, and category are required",
    };
  }
  return null;
}

export async function POST(request: Request) {
  let dbConnection = false;

  try {
    // Get session and check authorization
    const session = await getServerSession(authOptions);
    console.log("Full session data:", {
      session,
      user: session?.user,
      userId: session?.user?._id,
      userRole: session?.user?.role,
      isAdmin: session?.user?.admin,
    });

    if (!session?.user?.admin) {
      console.log("Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database first
    try {
      await connectToDatabase();
      dbConnection = true;
      console.log("Database connection successful");
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      return NextResponse.json(
        {
          error: "Database connection failed",
          details:
            dbError instanceof Error
              ? dbError.message
              : "Unknown database error",
        },
        { status: 500 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: BlogPostData = await request.json();
    console.log("Received request body:", JSON.stringify(data, null, 2));

    const validationError = validateBlogPost(data);
    if (validationError) {
      return new Response(JSON.stringify(validationError), { status: 400 });
    }

    const {
      title,
      content,
      excerpt,
      category,
      status,
      featured,
      mainImage,
      tags,
      seo,
    } = data;

    // Validate required fields with detailed error messages
    if (!title?.en || !title?.["zh-TW"]) {
      console.log("Title validation failed:", title);
      return NextResponse.json(
        {
          error: "Title validation failed",
          details: {
            en: !title?.en ? "English title is required" : null,
            "zh-TW": !title?.["zh-TW"] ? "Chinese title is required" : null,
          },
        },
        { status: 400 }
      );
    }

    if (!content?.en || !content?.["zh-TW"]) {
      console.log("Content validation failed:", content);
      return NextResponse.json(
        {
          error: "Content validation failed",
          details: {
            en: !content?.en ? "English content is required" : null,
            "zh-TW": !content?.["zh-TW"] ? "Chinese content is required" : null,
          },
        },
        { status: 400 }
      );
    }

    if (!category) {
      console.log("Category validation failed");
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    // If this is a featured post, unset featured flag on other posts
    if (featured) {
      try {
        await BlogPost.updateMany(
          { featured: true },
          { $set: { featured: false } }
        );
        console.log("Updated featured status of other posts");
      } catch (featuredError) {
        console.error("Error updating featured posts:", featuredError);
        // Continue with post creation even if this fails
      }
    }

    // Prepare the blog post data
    const blogPostData = {
      title,
      content,
      excerpt: excerpt || { en: "", "zh-TW": "" },
      category,
      status: status || "draft",
      featured: featured || false,
      mainImage,
      tags: tags || [],
      seo: {
        metaTitle: seo?.metaTitle || { en: "", "zh-TW": "" },
        metaDescription: seo?.metaDescription || { en: "", "zh-TW": "" },
        keywords: seo?.keywords || [],
      },
      author: session.user._id,
    };

    console.log(
      "Attempting to create blog post with data:",
      JSON.stringify(blogPostData, null, 2)
    );

    // Create the blog post
    try {
      const blogPost = await BlogPost.create(blogPostData);
      console.log("Blog post created successfully:", blogPost._id);
      return NextResponse.json({ post: blogPost }, { status: 201 });
    } catch (createError: any) {
      console.error("Error creating blog post:", createError);
      return NextResponse.json(
        {
          error: "Failed to create blog post",
          details: createError.message,
          code: createError.code,
          name: createError.name,
          data: blogPostData, // Include the data that failed to help debugging
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Unexpected error in POST handler:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        dbConnection, // Include database connection status
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: BlogPostData = await request.json();

    const validationError = validateBlogPost(data);
    if (validationError) {
      return new Response(JSON.stringify(validationError), { status: 400 });
    }

    // Process the update
    // ... rest of the code ...
  } catch (error: unknown) {
    return handleError(error);
  }
}

interface BlogPostError {
  message: string;
  details?: string;
}

function handleError(error: unknown): Response {
  console.error("Error:", error);
  const errorResponse: BlogPostError = {
    message: "Failed to process blog post",
  };

  if (error instanceof Error) {
    errorResponse.details = error.message;
  }

  return new Response(JSON.stringify(errorResponse), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
