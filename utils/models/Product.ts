import mongoose from "mongoose";

interface MultiLangString {
  en: string;
  "zh-TW": string;
}

interface ProductDocument extends mongoose.Document {
  name: string;
  slug: string;
  displayNames: MultiLangString;
  description: string;
  descriptions: MultiLangString;
  price: number;
  netPrice: number;
  originalPrice: number;
  images: string[];
  brand: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  stock: number;
  averageRating: number;
  numReviews: number;
  user: mongoose.Types.ObjectId;
  order: number;
  purchasedBy: mongoose.Types.ObjectId[];
  draft: boolean;
  version: number;
  specifications: Array<{
    key: string;
    value: MultiLangString;
    type: string;
    displayNames?: MultiLangString;
  }>;
  featured: boolean;
  isBestSelling: boolean;
  isProductOfTheMonth: boolean;
  productOfTheMonthDetails: Record<string, any>;
  lastSaved: Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

const specificationSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    value: {
      en: { type: String, default: "" },
      "zh-TW": { type: String, default: "" },
    },
    type: {
      type: String,
      required: true,
      enum: ["text", "number", "select"],
      default: "text",
    },
    selectedOptionPrice: {
      type: Number,
      default: 0,
      validate: {
        validator: function (this: any, price: number) {
          return this.type !== "select" || price >= 0;
        },
        message: "Selected option price must be non-negative",
      },
    },
    displayNames: {
      en: { type: String, required: true },
      "zh-TW": { type: String, required: true },
    },
    options: {
      en: {
        type: [String],
        default: undefined,
        validate: {
          validator: function (this: any, options: string[] | undefined) {
            return (
              this.type !== "select" ||
              (Array.isArray(options) && options.length > 0)
            );
          },
          message:
            "English options are required for select-type specifications",
        },
      },
      "zh-TW": {
        type: [String],
        default: undefined,
        validate: {
          validator: function (this: any, options: string[] | undefined) {
            return (
              this.type !== "select" ||
              (Array.isArray(options) && options.length > 0)
            );
          },
          message:
            "Chinese options are required for select-type specifications",
        },
      },
    },
    required: { type: Boolean, default: false },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema<ProductDocument>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    displayNames: {
      en: { type: String, required: true },
      "zh-TW": { type: String, required: true },
    },
    description: { type: String, required: true },
    descriptions: {
      en: { type: String, required: true },
      "zh-TW": { type: String, required: true },
    },
    price: { type: Number, required: true, min: 0 },
    netPrice: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, required: true, min: 0 },
    images: { type: [String], required: true, default: [] },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    stock: { type: Number, required: true, default: 0 },
    averageRating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: { type: Number, default: 0 },
    purchasedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
      },
    ],
    draft: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    specifications: {
      type: [specificationSchema],
      default: [],
      validate: {
        validator: function (specs: any[]) {
          return specs.every((spec) => {
            const isValid =
              spec.key &&
              spec.value &&
              typeof spec.value === "object" &&
              "en" in spec.value &&
              "zh-TW" in spec.value &&
              spec.displayNames &&
              typeof spec.displayNames === "object" &&
              "en" in spec.displayNames &&
              "zh-TW" in spec.displayNames;

            // Additional validation for option price
            if (
              spec.type === "select" &&
              spec.selectedOptionPrice !== undefined
            ) {
              return (
                isValid &&
                typeof spec.selectedOptionPrice === "number" &&
                spec.selectedOptionPrice >= 0
              );
            }

            return isValid;
          });
        },
        message:
          "Invalid specifications format. Each specification must have key, value (with en and zh-TW), displayNames (with en and zh-TW), and valid selectedOptionPrice for select type",
      },
    },
    featured: { type: Boolean, default: false },
    isBestSelling: { type: Boolean, default: false },
    isProductOfTheMonth: { type: Boolean, default: false },
    productOfTheMonthDetails: { type: mongoose.Schema.Types.Mixed },
    lastSaved: { type: Date, default: Date.now },
    __v: { type: Number, default: 0 },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt
  }
);

// Add indexes for better query performance
productSchema.index({ name: 1 });
productSchema.index({ "displayNames.en": 1 });
productSchema.index({ "displayNames.zh-TW": 1 });
productSchema.index({ price: 1 });
productSchema.index({ netPrice: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ category: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ isBestSelling: 1 });
productSchema.index({ isProductOfTheMonth: 1 });
productSchema.index({ order: 1 });
productSchema.index({ lastSaved: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ updatedAt: -1 });

if (mongoose.models.Product) {
  delete mongoose.models.Product;
}

export const Product = mongoose.model<ProductDocument>(
  "Product",
  productSchema
);
export default Product;
