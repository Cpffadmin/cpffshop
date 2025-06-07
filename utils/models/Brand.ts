import mongoose from "mongoose";

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true },
  legacyBrandName: { type: String },
  displayNames: {
    en: { type: String },
    "zh-TW": { type: String },
  },
  descriptions: {
    en: { type: String },
    "zh-TW": { type: String },
  },
  icon: { type: String },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export interface IBrand extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  legacyBrandName?: string;
  displayNames?: {
    en: string;
    "zh-TW": string;
  };
  descriptions?: {
    en: string;
    "zh-TW": string;
  };
  icon?: string;
  isActive: boolean;
  order: number;
  products: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const Brand =
  mongoose.models.Brand || mongoose.model<IBrand>("Brand", brandSchema);

export default Brand;
