import mongoose from "mongoose";

interface MultiLangField {
  en: string;
  "zh-TW": string;
}

export interface IBlogPost extends mongoose.Document {
  title: MultiLangField;
  slug: string;
  content: MultiLangField;
  excerpt: MultiLangField;
  author: mongoose.Types.ObjectId;
  status: "draft" | "published";
  featured: boolean;
  featuredImage?: string;
  tags: string[];
  category: string;
  publishedAt?: Date;
  updatedAt: Date;
  createdAt: Date;
  seo: {
    metaTitle: MultiLangField;
    metaDescription: MultiLangField;
    keywords: string[];
  };
}

const multiLangFieldSchema = {
  en: {
    type: String,
    required: true,
    trim: true,
  },
  "zh-TW": {
    type: String,
    required: true,
    trim: true,
  },
};

const blogPostSchema = new mongoose.Schema<IBlogPost>(
  {
    title: multiLangFieldSchema,
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    content: multiLangFieldSchema,
    excerpt: {
      en: {
        type: String,
        trim: true,
      },
      "zh-TW": {
        type: String,
        trim: true,
      },
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    featuredImage: {
      type: String,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    publishedAt: {
      type: Date,
      sparse: true,
    },
    seo: {
      metaTitle: {
        en: {
          type: String,
          trim: true,
        },
        "zh-TW": {
          type: String,
          trim: true,
        },
      },
      metaDescription: {
        en: {
          type: String,
          trim: true,
        },
        "zh-TW": {
          type: String,
          trim: true,
        },
      },
      keywords: [
        {
          type: String,
          trim: true,
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for common queries
blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ status: 1, createdAt: -1 });
blogPostSchema.index({ tags: 1, status: 1 });
blogPostSchema.index({ category: 1, status: 1 });

// Generate slug before saving
blogPostSchema.pre("save", async function (next) {
  try {
    if (this.isModified("title")) {
      // Generate base slug from English title
      const baseSlug = this.title.en
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric chars with hyphen
        .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
        .substring(0, 200); // Limit length

      // Check if the slug already exists (excluding the current document if it's an update)
      let counter = 0;
      let exists = true;
      let finalSlug = baseSlug;

      while (exists) {
        const slugToCheck = counter === 0 ? baseSlug : `${baseSlug}-${counter}`;
        const existingPost = await mongoose.models.BlogPost.exists({
          slug: slugToCheck,
          _id: { $ne: this._id },
        });
        exists = existingPost !== null;
        if (!exists) {
          finalSlug = slugToCheck;
        }
        counter++;
      }

      this.slug = finalSlug;
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Ensure only one featured post
blogPostSchema.pre("save", async function (next) {
  try {
    if (this.featured && this.isModified("featured")) {
      await mongoose.models.BlogPost.updateMany(
        { _id: { $ne: this._id } },
        { featured: false }
      );
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

const BlogPost =
  mongoose.models.BlogPost ||
  mongoose.model<IBlogPost>("BlogPost", blogPostSchema);

export default BlogPost;
