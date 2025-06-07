import mongoose, { Document } from "mongoose";

interface Specification {
  label: string;
  key: string;
  type: "text" | "number" | "select";
  options?: string[];
  required: boolean;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  descriptions: {
    en: string;
    "zh-TW": string;
  };
}

export interface CategoryDocument extends Document {
  name: string;
  slug: string;
  displayNames: {
    en: string;
    "zh-TW": string;
  };
  descriptions: {
    en: string;
    "zh-TW": string;
  };
  specifications?: Specification[];
  products: mongoose.Types.ObjectId[];
}

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      unique: true,
    },
    slug: {
      type: String,
      required: [true, "Slug is required"],
      unique: true,
      lowercase: true,
    },
    displayNames: {
      en: {
        type: String,
        required: [true, "English display name is required"],
      },
      "zh-TW": {
        type: String,
        required: [true, "Chinese display name is required"],
      },
    },
    descriptions: {
      en: {
        type: String,
        default: "",
      },
      "zh-TW": {
        type: String,
        default: "",
      },
    },
    specifications: [
      {
        label: { type: String, required: true },
        key: { type: String, required: true },
        type: {
          type: String,
          enum: ["text", "number", "select"],
          required: true,
        },
        options: [String],
        required: { type: Boolean, default: false },
        displayNames: {
          en: { type: String, required: true },
          "zh-TW": { type: String, required: true },
        },
        descriptions: {
          en: { type: String, default: "" },
          "zh-TW": { type: String, default: "" },
        },
      },
    ],
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to generate slug
categorySchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }
  next();
});

const Category =
  mongoose.models.Category ||
  mongoose.model<CategoryDocument>("Category", categorySchema);

export default Category;
