import mongoose from "mongoose";
import { CategorySpecification, ProductSpecification } from "@/types";
import Brand from "./Brand";
import Category from "./Category";

const specificationSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    type: { type: String, enum: ["text", "number", "select"], required: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"] },
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
    description: { type: String, required: [true, "Description is required"] },
    descriptions: {
      en: {
        type: String,
        required: [true, "English description is required"],
      },
      "zh-TW": {
        type: String,
        required: [true, "Chinese description is required"],
      },
    },
    images: [{ type: String }],
    price: { type: Number, required: [true, "Price is required"] },
    netPrice: { type: Number },
    originalPrice: { type: Number },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },
    material: { type: String, default: "Not Specified" },
    bracelet: { type: String },
    condition: { type: String, default: "Not Specified" },
    featured: { type: Boolean, default: false },
    stock: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },
    movement: { type: String },
    thickness: { type: String },
    glass: { type: String },
    luminova: { type: String },
    casematerial: { type: String },
    crown: { type: String },
    bandsize: { type: String },
    lugs: { type: String },
    water: { type: String },
    purchasedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    draft: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    lastSaved: { type: Date, default: Date.now },
    specifications: [specificationSchema],
    isBestSelling: { type: Boolean, default: false },
    isProductOfTheMonth: {
      type: Boolean,
      default: false,
    },
    productOfTheMonthDetails: {
      description: {
        en: String,
        "zh-TW": String,
      },
      features: [
        {
          icon: String,
          title: {
            en: String,
            "zh-TW": String,
          },
          description: {
            en: String,
            "zh-TW": String,
          },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
productSchema.index({ name: 1 });
productSchema.index({ price: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ isBestSelling: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ draft: 1 });
productSchema.index({ category: 1 });

// Only keep one:
productSchema.index({ isProductOfTheMonth: 1 });

// Pre-save middleware to validate specifications against category
productSchema.pre("save", async function (next) {
  try {
    if (this.isModified("specifications") || this.isModified("category")) {
      const Category = mongoose.model("Category");
      const category = await Category.findById(this.category);

      if (!category) {
        throw new Error("Category not found");
      }

      // Validate required specifications
      const requiredSpecs =
        category.specifications?.filter(
          (spec: CategorySpecification) => spec.required
        ) || [];
      const missingSpecs = requiredSpecs.filter(
        (spec: CategorySpecification) =>
          !this.specifications.some(
            (s: ProductSpecification) => s.key === spec.key
          )
      );

      if (missingSpecs.length > 0) {
        throw new Error(
          `Missing required specifications: ${missingSpecs
            .map((s: CategorySpecification) => s.label)
            .join(", ")}`
        );
      }

      // Validate specification types
      for (const spec of this.specifications) {
        const categorySpec = category.specifications?.find(
          (s: CategorySpecification) => s.key === spec.key
        );
        if (!categorySpec) {
          throw new Error(`Invalid specification key: ${spec.key}`);
        }

        if (spec.type !== categorySpec.type) {
          throw new Error(`Invalid type for specification ${spec.key}`);
        }

        if (categorySpec.type === "select" && categorySpec.options) {
          if (!categorySpec.options.includes(spec.value as string)) {
            throw new Error(
              `Invalid value for select specification ${spec.key}`
            );
          }
        }
      }
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

export default Product;
