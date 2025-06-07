import mongoose from "mongoose";

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  displayNames: {
    type: Map,
    of: String,
    default: {}, // e.g., { "en": "Rolex", "zh-TW": "劳力士" }
  },
  descriptions: {
    type: Map,
    of: String,
    default: {}, // e.g., { "en": "Luxury watches", "zh-TW": "奢侈手表" }
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamps on save
brandSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export interface IBrand {
  _id: string;
  name: string;
  displayNames: Map<string, string>;
  descriptions: Map<string, string>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const Brand =
  mongoose.models.Brand || mongoose.model("Brand", brandSchema);
