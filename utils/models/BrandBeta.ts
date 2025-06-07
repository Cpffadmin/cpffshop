import mongoose from "mongoose";

export interface IBrandBeta {
  _id: string;
  name: string;
  slug: string;
  displayName: string;
  icon: string;
  isActive: boolean;
  order: number;
  legacyBrandName: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const brandBetaSchema = new mongoose.Schema<IBrandBeta>(
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
    displayName: {
      type: String,
      required: [true, "Display name is required"],
    },
    icon: {
      type: String,
      default: "Watch",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    legacyBrandName: {
      type: String,
      required: [true, "Legacy brand name is required"],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

brandBetaSchema.index({ order: 1 });
brandBetaSchema.index({ isActive: 1 });

brandBetaSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }
  if (!this.displayName) {
    this.displayName = this.name;
  }
  next();
});

const BrandBeta =
  mongoose.models.BrandBeta ||
  mongoose.model<IBrandBeta>("BrandBeta", brandBetaSchema);

export default BrandBeta;
