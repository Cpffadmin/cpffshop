import mongoose from "mongoose";

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      en: { type: String, required: true },
      "zh-TW": { type: String, required: true },
    },
    content: {
      en: { type: String, required: true },
      "zh-TW": { type: String, required: true },
    },
    excerpt: {
      en: { type: String },
      "zh-TW": { type: String },
    },
    category: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    featured: { type: Boolean, default: false },
    featuredImage: { type: String },
    tags: [{ type: String }],
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    seo: {
      metaTitle: {
        en: { type: String },
        "zh-TW": { type: String },
      },
      metaDescription: {
        en: { type: String },
        "zh-TW": { type: String },
      },
      keywords: [{ type: String }],
    },
  },
  {
    timestamps: true,
  }
);

export const BlogPost =
  mongoose.models.BlogPost || mongoose.model("BlogPost", blogPostSchema);
